/**
 * Export user/tenant data (GDPR portability + bulk export)
 * GET /api/v1/exports?type=documents|tax|audit|all
 * Returns a signed URL for downloading the export.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { detectBulkExport } from "@/lib/security/events";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "exports", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const url = new URL(req.url);
    const exportType = url.searchParams.get("type") || "all";

    // Count records that will be exported (for security monitoring)
    const [docs, taxes, audits] = await Promise.all([
      db.document.count({ where: { userId: ctx.userId } }),
      db.taxEstimation.count({ where: { userId: ctx.userId } }),
      db.auditChainEntry.count({ where: { tenantId: ctx.tenantId } }),
    ]);
    const totalRecords = docs + taxes + audits;

    // Trigger security event if bulk export
    await detectBulkExport(ctx.userId, ctx.tenantId, totalRecords, exportType);

    // Generate export (in production: stream to S3 + return presigned URL)
    const exportData: any = {
      exportedAt: new Date().toISOString(),
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      type: exportType,
      summary: { documents: docs, taxes, auditEntries: audits },
    };

    if (exportType === "documents" || exportType === "all") {
      exportData.documents = await db.document.findMany({
        where: { userId: ctx.userId },
        select: {
          id: true, documentType: true, fileName: true, fileSizeBytes: true,
          mimeType: true, processingStatus: true, createdAt: true, updatedAt: true,
          extractedFields: { select: { fieldName: true, fieldValue: true, confidenceScore: true, verifiedByUser: true } },
        },
      });
    }

    if (exportType === "tax" || exportType === "all") {
      exportData.taxEstimations = await db.taxEstimation.findMany({
        where: { userId: ctx.userId },
      });
    }

    if (exportType === "audit" || exportType === "all") {
      exportData.auditEntries = await db.auditChainEntry.findMany({
        where: { tenantId: ctx.tenantId },
        take: 1000,
        orderBy: { timestamp: "desc" },
      });
    }

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "data.exported",
      details: { exportType, recordCount: totalRecords },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: exportData,
      meta: {
        format: "json",
        note: "In production, this returns a presigned S3 URL with a 1-hour expiry. For now, data is returned inline.",
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
