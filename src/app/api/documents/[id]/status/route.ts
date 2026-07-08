import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/documents/[id]/status — poll document processing status.
 * Used by the frontend when upload returns 202 (background processing).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const doc = await db.document.findUnique({
      where: { id },
      select: { id: true, userId: true, processingStatus: true, detectedDocType: true, confidenceScore: true, errorMessage: true },
    });

    if (!doc) return NextResponse.json({ detail: "Not found" }, { status: 404 });
    if (doc.userId !== payload.sub) return NextResponse.json({ detail: "Not your document" }, { status: 403 });

    return NextResponse.json({
      id: doc.id,
      status: doc.processingStatus,
      detected_type: doc.detectedDocType,
      confidence: doc.confidenceScore,
      error: doc.errorMessage,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch status" }, { status: 500 });
  }
}
