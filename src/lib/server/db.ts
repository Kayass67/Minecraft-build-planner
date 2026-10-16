/**
 * Server-side Database Service for MineBuild
 * Supports Supabase managed backend when configured via environment variables.
 */

export interface ContactMessageRecord {
  id?: string;
  name: string;
  reply_email: string;
  inquiry_type: string;
  subject: string;
  message: string;
  status?: "unread" | "reviewed" | "archived";
  created_at?: string;
}

export interface CommunitySubmissionRecord {
  id?: string;
  slug: string;
  title: string;
  creator_name: string;
  description: string;
  category: string;
  tags: string[];
  dimensions: { x: number; y: number; z: number };
  region_count: number;
  solid_block_count: number;
  minecraft_version: string;
  top_block_names: string[];
  downloadable: boolean;
  source_url?: string;
  screenshot_url?: string;
  screenshot_permission?: boolean;
  status: "pending" | "published" | "rejected";
  created_at?: string;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

/**
 * Saves a contact message to the contact_messages table via Supabase REST API.
 */
export async function saveContactMessage(
  record: Omit<ContactMessageRecord, "id" | "status" | "created_at">
): Promise<{ success: boolean; id?: string; configured: boolean; error?: string }> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      success: false,
      configured: false,
      error:
        "Database is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/contact_messages`;

  const payload = {
    name: record.name,
    reply_email: record.reply_email,
    inquiry_type: record.inquiry_type,
    subject: record.subject,
    message: record.message,
    status: "unread",
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase contact_messages insert failed:", errText);
      return {
        success: false,
        configured: true,
        error: `Database insert failed: ${res.statusText}`,
      };
    }

    const inserted = await res.json();
    const id = inserted?.[0]?.id || `msg_${Date.now()}`;
    return { success: true, id, configured: true };
  } catch (err: unknown) {
    console.error("Database connection error:", err);
    return {
      success: false,
      configured: true,
      error: err instanceof Error ? err.message : "Database connection error",
    };
  }
}

/**
 * Saves a community build submission to the community_builds table with status 'pending'.
 */
export async function saveCommunitySubmission(
  record: Omit<CommunitySubmissionRecord, "id" | "created_at">
): Promise<{ success: boolean; id?: string; configured: boolean; error?: string }> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      success: false,
      configured: false,
      error:
        "Database is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/community_builds`;

  const payload = {
    slug: record.slug,
    title: record.title,
    creator_name: record.creator_name,
    description: record.description,
    category: record.category,
    tags: record.tags,
    dimensions: record.dimensions,
    region_count: record.region_count,
    solid_block_count: record.solid_block_count,
    minecraft_version: record.minecraft_version,
    top_block_names: record.top_block_names,
    downloadable: record.downloadable,
    source_url: record.source_url || null,
    screenshot_url: record.screenshot_url || null,
    screenshot_permission: Boolean(record.screenshot_permission),
    status: "pending",
    created_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase community_builds insert failed:", errText);
      return {
        success: false,
        configured: true,
        error: `Database insert failed: ${res.statusText}`,
      };
    }

    const inserted = await res.json();
    const id = inserted?.[0]?.id || `sub_${Date.now()}`;
    return { success: true, id, configured: true };
  } catch (err: unknown) {
    console.error("Database connection error:", err);
    return {
      success: false,
      configured: true,
      error: err instanceof Error ? err.message : "Database connection error",
    };
  }
}

/**
 * Fetch messages for the owner if authorized.
 */
export async function getContactMessagesForOwner(): Promise<{
  success: boolean;
  messages: ContactMessageRecord[];
  error?: string;
}> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return {
      success: false,
      messages: [],
      error: "SUPABASE_SERVICE_ROLE_KEY is required to retrieve private contact messages.",
    };
  }

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/contact_messages?select=*&order=created_at.desc`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (!res.ok) {
      return { success: false, messages: [], error: res.statusText };
    }

    const messages = await res.json();
    return { success: true, messages };
  } catch (err: unknown) {
    return {
      success: false,
      messages: [],
      error: err instanceof Error ? err.message : "Fetch error",
    };
  }
}
