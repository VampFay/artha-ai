import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET extracted fields for a document
export async function GET(req: NextRequest, { params }: { params: Promise<{ doc_id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { doc_id } = await params;
    const doc = await db.document.findUnique({ where: { id: doc_id } });
    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Not your document" }, { status: 403 });

    const fields = await db.extractedField.findMany({ where: { documentId: doc_id }, orderBy: { fieldName: "asc" } });
    // Mask sensitive fields — show only last 4 chars for PAN/account
    const masked = fields.map((f) => {
      let value = f.fieldValue;
      if (f.fieldName.includes("pan") && value.length > 4) value = "X".repeat(value.length - 4) + value.slice(-4);
      if (f.fieldName.includes("account") && value.length > 4) value = "X".repeat(value.length - 4) + value.slice(-4);
      return { id: f.id, document_id: f.documentId, field_name: f.fieldName, field_value: value, confidence_score: f.confidenceScore, verified_by_user: f.verifiedByUser, source_snippet: f.sourceSnippet };
    });
    return NextResponse.json({ items: masked, total: masked.length, document_id: doc_id });
  } catch { return NextResponse.json({ detail: "Failed to fetch fields" }, { status: 500 }); }
}
