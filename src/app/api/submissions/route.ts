import { NextRequest, NextResponse } from "next/server";
import { saveCommunitySubmission, isDatabaseConfigured } from "@/lib/server/db";
import { validateImageBuffer } from "@/lib/server/imageValidation";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const screenshot = formData.get("screenshot") as File | null;
    const title = formData.get("title") as string | null;
    const creatorName = formData.get("creatorName") as string | null;
    const description = formData.get("description") as string | null;
    const category = formData.get("category") as string | null;
    const tagsRaw = (formData.get("tags") as string) || "";
    const sourceUrl = (formData.get("sourceUrl") as string) || "";
    const rightsConfirmed = formData.get("rightsConfirmed") === "true";
    const screenshotPermission = formData.get("screenshotPermission") === "true";
    const allowDownload = formData.get("allowDownload") === "true";

    const dimensionsRaw = formData.get("dimensions") as string | null;
    const solidBlocksRaw = formData.get("solidBlocks") as string | null;
    const regionCountRaw = formData.get("regionCount") as string | null;
    const topBlocksRaw = formData.get("topBlocks") as string | null;

    // Validation
    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".litematic")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .litematic schematics are supported." },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds the 50MB upload limit." },
        { status: 400 }
      );
    }

    // Verify magic bytes (GZIP 1F 8B)
    const arrayBuffer = await file.arrayBuffer();
    const magicView = new Uint8Array(arrayBuffer, 0, 2);
    if (magicView.length < 2 || magicView[0] !== 0x1f || magicView[1] !== 0x8b) {
      return NextResponse.json(
        { error: "Corrupt file format. Expected GZIP compressed .litematic." },
        { status: 400 }
      );
    }

    if (!title || title.trim().length < 2) {
      return NextResponse.json({ error: "Title must be at least 2 characters." }, { status: 400 });
    }

    if (!creatorName || creatorName.trim().length < 2) {
      return NextResponse.json(
        { error: "Creator name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { error: "Description must be at least 10 characters." },
        { status: 400 }
      );
    }

    if (!rightsConfirmed) {
      return NextResponse.json(
        {
          error:
            "Creator rights confirmation is required before submitting community content.",
        },
        { status: 400 }
      );
    }

    // Optional Genuine Screenshot Validation
    let screenshotDataUrl: string | undefined;
    if (screenshot && screenshot.size > 0) {
      if (!screenshotPermission) {
        return NextResponse.json(
          {
            error:
              "Screenshot authorization confirmation is required when attaching a build screenshot. Please confirm you took this screenshot or have permission to display it.",
          },
          { status: 400 }
        );
      }

      const screenshotBuffer = await screenshot.arrayBuffer();
      const imgCheck = validateImageBuffer(screenshotBuffer);
      if (!imgCheck.valid) {
        return NextResponse.json(
          { error: imgCheck.error || "Invalid screenshot file." },
          { status: 400 }
        );
      }

      const screenshotBase64 = Buffer.from(screenshotBuffer).toString("base64");
      screenshotDataUrl = `data:image/${imgCheck.format};base64,${screenshotBase64}`;
    }

    // Parse optional metadata fields
    let dimensions = { x: 0, y: 0, z: 0 };
    if (dimensionsRaw) {
      try {
        dimensions = JSON.parse(dimensionsRaw);
      } catch {}
    }

    const solidBlockCount = solidBlocksRaw ? parseInt(solidBlocksRaw, 10) || 0 : 0;
    const regionCount = regionCountRaw ? parseInt(regionCountRaw, 10) || 1 : 1;

    let topBlockNames: string[] = [];
    if (topBlocksRaw) {
      try {
        topBlockNames = JSON.parse(topBlocksRaw);
      } catch {}
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);

    const cleanSlug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}-${Date.now().toString(36)}`;

    // Database check
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Community submission storage is not yet configured on this deployment. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable public submissions.",
          configured: false,
        },
        { status: 503 }
      );
    }

    const result = await saveCommunitySubmission({
      slug: cleanSlug,
      title: title.trim().slice(0, 100),
      creator_name: creatorName.trim().slice(0, 60),
      description: description.trim().slice(0, 1000),
      category: (category || "Survival & Starter").slice(0, 50),
      tags,
      dimensions,
      region_count: regionCount,
      solid_block_count: solidBlockCount,
      minecraft_version: "1.20.4",
      top_block_names: topBlockNames,
      downloadable: allowDownload,
      source_url: sourceUrl.trim() || undefined,
      screenshot_url: screenshotDataUrl,
      screenshot_permission: Boolean(screenshotPermission && screenshotDataUrl),
      status: "pending",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to persist community build." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: result.id,
      status: "pending",
      message: "Submission received and queued for moderator review.",
    });
  } catch (err: unknown) {
    console.error("Submission API error:", err);
    return NextResponse.json(
      { error: "Internal server error processing build submission." },
      { status: 500 }
    );
  }
}
