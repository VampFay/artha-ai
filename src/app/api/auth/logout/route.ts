import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revokeToken, verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const payload = await verifyToken(token);
    if (payload) {
      await revokeToken(token, payload.sub);
      await db.auditLog.create({ data: { userId: payload.sub, action: "logout" } });
    }
  }
  return NextResponse.json({ message: "Logged out successfully." });
}
