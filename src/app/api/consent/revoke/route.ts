import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    // Revoke all active consents for this user
    const result = await db.userConsent.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await db.auditLog.create({ data: { userId: payload.sub, action: "consent_revoked", details: JSON.stringify({ count: result.count }) } });
    return NextResponse.json({ message: `Revoked ${result.count} consent(s).` });
  } catch { return NextResponse.json({ detail: "Failed to revoke consent" }, { status: 500 }); }
}
