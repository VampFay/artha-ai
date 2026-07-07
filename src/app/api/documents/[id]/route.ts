import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getFileStore } from "@/lib/storage/file-store";

// DELETE single document
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Not your document" }, { status: 403 });

    // Delete file using storage abstraction
    const fileStore = getFileStore();
    await fileStore.delete(doc.filePath);

    // Delete DB records (cascade deletes ExtractedField)
    await db.document.delete({ where: { id } });
    await db.auditLog.create({ data: { userId: payload.sub, action: "document_deleted", details: JSON.stringify({ document_id: id }) } });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ detail: "Failed to delete" }, { status: 500 }); }
}
