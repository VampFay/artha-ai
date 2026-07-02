import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const items = await db.userConsent.findMany({ where: { userId: payload.sub }, orderBy: { acceptedAt: "desc" } });
    return NextResponse.json({ items: items.map((c) => ({ id: c.id, consent_type: c.consentType, consent_text: c.consentText, accepted_at: c.acceptedAt, revoked_at: c.revokedAt })), total: items.length });
  } catch { return NextResponse.json({ detail: "Failed to fetch consent history" }, { status: 500 }); }
}
