import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getClientIp } from "@/lib/security";
import { z } from "zod";

const VerifySchema = z.object({ value: z.string().max(500).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ doc_id: string; field_id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { doc_id, field_id } = await params;
    const doc = await db.document.findUnique({ where: { id: doc_id } });
    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Invalid value (max 500 chars)" }, { status: 422 });

    const field = await db.extractedField.findUnique({ where: { id: field_id } });
    if (!field || field.documentId !== doc_id) return NextResponse.json({ detail: "Field not found" }, { status: 404 });

    await db.extractedField.update({
      where: { id: field_id },
      data: { fieldValue: parsed.data.value ?? field.fieldValue, verifiedByUser: true, confidenceScore: 1.0 },
    });
    return NextResponse.json({ id: field_id, verified: true });
  } catch {
    return NextResponse.json({ detail: "Failed to verify" }, { status: 500 });
  }
}
