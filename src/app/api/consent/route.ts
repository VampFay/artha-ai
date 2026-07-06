import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, CONSENT_TEXT } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ consent_type: "document_processing", consent_text: CONSENT_TEXT });
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (body.consent_type !== "document_processing") return NextResponse.json({ detail: "Invalid consent type" }, { status: 400 });
    if (body.consent_text !== CONSENT_TEXT) return NextResponse.json({ detail: "Consent text mismatch." }, { status: 400 });
    const consent = await db.userConsent.create({ data: { userId: payload.sub, consentType: body.consent_type, consentText: body.consent_text } });
    await db.auditLog.create({ data: { userId: payload.sub, action: "consent_accepted" } });
    return NextResponse.json({ id: consent.id, consent_type: consent.consentType, consent_text: consent.consentText, accepted_at: consent.acceptedAt, revoked_at: consent.revokedAt }, { status: 201 });
  } catch { return NextResponse.json({ detail: "Failed to process consent" }, { status: 500 }); }
}
