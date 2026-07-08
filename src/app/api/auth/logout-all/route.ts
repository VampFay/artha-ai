import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, revokeAllRefreshTokens, revokeToken } from "@/lib/auth";

/**
 * POST /api/auth/logout-all — revoke all refresh tokens + current access token.
 * Logs out all devices for the current user.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    // Revoke all refresh tokens
    await revokeAllRefreshTokens(payload.sub);

    // Revoke current access token
    await revokeToken(auth.slice(7), payload.sub);

    await db.auditLog.create({
      data: { userId: payload.sub, action: "logout_all_devices", details: "{}" },
    });

    return NextResponse.json({ message: "Logged out from all devices" });
  } catch {
    return NextResponse.json({ detail: "Failed to logout" }, { status: 500 });
  }
}
