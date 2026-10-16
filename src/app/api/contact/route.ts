import { NextRequest, NextResponse } from "next/server";
import { saveContactMessage, isDatabaseConfigured } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, replyEmail, inquiryType, subject, message, honeypot } = body;

    // Spam honeypot detection
    if (honeypot) {
      return NextResponse.json({ success: true, messageId: "msg_ok" });
    }

    // Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (
      !replyEmail ||
      typeof replyEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyEmail.trim())
    ) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
      return NextResponse.json(
        { error: "Subject must be at least 3 characters." },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Check if database backend is configured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Contact storage backend is not yet configured on this deployment. Please configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to enable durable message storage.",
          configured: false,
        },
        { status: 503 }
      );
    }

    // Persist to database
    const result = await saveContactMessage({
      name: name.trim().slice(0, 100),
      reply_email: replyEmail.trim().slice(0, 120),
      inquiry_type: (inquiryType || "general").slice(0, 50),
      subject: subject.trim().slice(0, 150),
      message: message.trim().slice(0, 3000),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to store message in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    console.error("Contact API handler error:", err);
    return NextResponse.json(
      { error: "Internal server error processing contact submission." },
      { status: 500 }
    );
  }
}
