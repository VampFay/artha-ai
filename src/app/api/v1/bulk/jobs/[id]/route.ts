/**
 * Get bulk job status
 * GET /api/v1/bulk/jobs/:id
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "bulk_jobs", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const { id } = await params;
    const job = await db.bulkJob.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!job) return errorResponse({ message: "Job not found", statusCode: 404 });

    return Response.json({ data: job });
  } catch (err: any) {
    return errorResponse(err);
  }
}
