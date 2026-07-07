import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getFileStore } from "@/lib/storage/file-store";

// Authenticated file download — only the owner can download their documents
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const doc = await db.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Not your document" }, { status: 403 });

    // Read file using storage abstraction (local or S3)
    const fileStore = getFileStore();
    const fileBuffer = await fileStore.read(doc.filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch { return NextResponse.json({ detail: "Failed to download" }, { status: 500 }); }
}
