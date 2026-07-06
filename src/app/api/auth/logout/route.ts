import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revokeToken, verifyToken } from "@/lib/auth";
import { getClientIp } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const payload = await verifyToken(token);
      if (payload) {
        await revokeToken(token, payload.sub);
        await db.auditLog.create({ data: { userId: payload.sub, action: "logout", ipAddress: ip } });
      }
    }
    return NextResponse.json({ message: "Logged out successfully." });
  } catch {
    return NextResponse.json({ detail: "Logout failed" }, { status: 500 });
  }
}
