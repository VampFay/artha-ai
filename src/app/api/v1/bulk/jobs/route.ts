/**
 * Bulk Job management
 * GET  /api/v1/bulk/jobs        — list bulk jobs
 * POST /api/v1/bulk/jobs        — create bulk job (upload manifest URL)
 *
 * Supports: bulk_document_upload, bulk_tax_compute, core_banking_export
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { dispatchWebhookEvent } from "@/lib/security/webhooks";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "bulk_jobs", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const jobs = await db.bulkJob.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return Response.json({ data: jobs });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "bulk_jobs", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const jobType = body.jobType;
    const validTypes = ["bulk_document_upload", "bulk_tax_compute", "core_banking_export"];
    if (!validTypes.includes(jobType)) {
      return errorResponse({ message: `Invalid jobType. Must be one of: ${validTypes.join(", ")}`, statusCode: 400 });
    }

    const job = await db.bulkJob.create({
      data: {
        tenantId: ctx.tenantId,
        jobType,
        status: "queued",
        inputUri: body.inputUri || null,
        metadataJson: body.metadata ? JSON.stringify(body.metadata) : null,
        createdBy: ctx.userId,
      },
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "bulk_job.created",
      details: { jobId: job.id, jobType },
      ipAddress: ctx.ipAddress,
    });

    // Trigger webhook event
    await dispatchWebhookEvent({
      eventType: "bulk_job.created",
      tenantId: ctx.tenantId,
      payload: { id: job.id, jobType, status: "queued" },
    });

    // TODO: enqueue job for processing (SQS/Kafka in prod, in-memory in dev)
    // For now, mark as processing and let a worker pick it up
    processBulkJob(job.id, ctx.tenantId).catch((err) => {
      console.error("Bulk job processing failed:", err);
    });

    return Response.json({ data: job }, { status: 202 });
  } catch (err: any) {
    return errorResponse(err);
  }
}

/**
 * Process a bulk job (stub — in production this runs in a separate worker).
 */
async function processBulkJob(jobId: string, tenantId: string): Promise<void> {
  await db.bulkJob.update({
    where: { id: jobId },
    data: { status: "processing", startedAt: new Date() },
  });

  // In production: download manifest from S3, iterate, process each item,
  // update progress, dispatch webhooks on completion.
  // For now, mark as completed after a short delay.
  setTimeout(async () => {
    try {
      await db.bulkJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          completedAt: new Date(),
          totalItems: 0,
          processedItems: 0,
        },
      });
      await dispatchWebhookEvent({
        eventType: "bulk_job.completed",
        tenantId,
        payload: { id: jobId, status: "completed" },
      });
    } catch (err) {
      console.error("Failed to complete bulk job:", err);
    }
  }, 1000);
}
