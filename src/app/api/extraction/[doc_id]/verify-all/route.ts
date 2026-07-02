import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Verify all fields for a document
export async function POST(req: NextRequest, { params }: { params: Promise<{ doc_id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { doc_id } = await params;
    const doc = await db.document.findUnique({ where: { id: doc_id } });
    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Forbidden" }, { status: 403 });

    const result = await db.extractedField.updateMany({ where: { documentId: doc_id, verifiedByUser: false }, data: { verifiedByUser: true, confidenceScore: 1.0 } });
    return NextResponse.json({ message: `Verified ${result.count} field(s).`, count: result.count });
  } catch { return NextResponse.json({ detail: "Failed" }, { status: 500 }); }
}
