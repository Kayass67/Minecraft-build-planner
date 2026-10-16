import { NextRequest, NextResponse } from "next/server";
import { getContactMessagesForOwner } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET_KEY is not configured on this server." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const queryKey = req.nextUrl.searchParams.get("key");

  const providedKey = bearerToken || queryKey;
  if (!providedKey || providedKey !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getContactMessagesForOwner();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    count: result.messages.length,
    messages: result.messages,
  });
}
