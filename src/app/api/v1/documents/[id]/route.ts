/**
 * GET /api/v1/documents/:id
 * Get document status + extracted data.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "documents", "read");

    const { id } = await params;
    const doc = await db.document.findFirst({
      where: { id, userId: ctx.userId },
      include: { extractedFields: true },
    });

    if (!doc) return errorResponse({ message: "Document not found", statusCode: 404 });

    return Response.json({
      data: {
        id: doc.id,
        document_type: doc.documentType,
        file_name: doc.fileName,
        file_size: doc.fileSizeBytes,
        mime_type: doc.mimeType,
        processing_status: doc.processingStatus,
        confidence_score: doc.confidenceScore,
        error_message: doc.errorMessage,
        detected_doc_type: doc.detectedDocType,
        extracted_fields: doc.extractedFields.map((f) => ({
          field_name: f.fieldName,
          field_value: f.fieldValue,
          confidence_score: f.confidenceScore,
          verified_by_user: f.verifiedByUser,
          source_snippet: f.sourceSnippet,
        })),
        created_at: doc.createdAt,
        updated_at: doc.updatedAt,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
