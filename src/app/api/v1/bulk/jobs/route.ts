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

    // Job is queued — a background worker (SQS/Kafka in prod, in-memory in dev)
    // will pick it up and process. The worker is in src/workers/ (not yet active
    // in dev mode — jobs remain in "queued" status until a worker is started).
    // To process: run `bun run scripts/start-worker.ts`

    return Response.json({ data: job }, { status: 202 });
  } catch (err: any) {
    return errorResponse(err);
  }
}

/**
 * Process a bulk job — called by the background worker.
 * This function is NOT called from the API route (fire-and-forget would be
 * unreliable). Instead, a separate worker process polls for queued jobs.
 *
 * To start the worker: bun run scripts/start-worker.ts
 */
export async function processBulkJob(jobId: string, tenantId: string): Promise<void> {
  await db.bulkJob.update({
    where: { id: jobId },
    data: { status: "processing", startedAt: new Date() },
  });

  const job = await db.bulkJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  try {
    // Process based on job type
    // In production: download manifest from S3, iterate, process each item
    // For now: mark as completed with 0 items (no items to process without manifest)
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
      payload: { id: jobId, status: "completed", jobType: job.jobType },
    });
  } catch (err: any) {
    await db.bulkJob.update({
      where: { id: jobId },
      data: { status: "failed", errorMessage: err.message, completedAt: new Date() },
    });
  }
}
