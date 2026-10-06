/**
 * Chunked multipart upload to S3 — bypasses server CPU for large files.
 * WP2.1 — eliminates CPU starvation from synchronous uploads.
 *
 * Endpoints:
 *   POST   /api/documents/multipart           — init multipart upload (returns uploadId)
 *   PUT    /api/documents/multipart/[id]/part/[n]  — upload a 5MB chunk
 *   PATCH  /api/documents/multipart/[id]      — complete + queue parse job
 *   DELETE /api/documents/multipart/[id]      — abort
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, CreateMultipartUploadCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { requireAuth, errorResponse, AuthError } from "@/lib/security/middleware";
import { enforceRateLimit, RateLimitPolicies } from "@/lib/security/rate-limit";
import { getDocumentQueue } from "@/lib/queues";
import { logger } from "@/lib/logger";
import { z as Z } from "zod";

const PART_SIZE = 5 * 1024 * 1024; // 5MB (S3 min chunk)
const MAX_PARTS = 1000;
const MAX_TOTAL = PART_SIZE * MAX_PARTS; // 5GB cap

function getS3() {
  if (process.env.STORAGE_DRIVER !== "s3") return null;
  return new S3Client({
    region: process.env.S3_REGION!,
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
  });
}

const InitSchema = Z.object({
  filename: Z.string().min(1).max(255),
  contentType: Z.string().min(1).max(100),
  size: Z.number().int().positive().max(MAX_TOTAL),
});

// Shared state — abstracted via uploadStore so we can swap to Redis in prod
import { uploadStore } from "@/lib/realtime/upload-store";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const limited = await enforceRateLimit(req, "multipart-init", RateLimitPolicies.UPLOAD, ctx.userId);
    if (limited) return limited;

    const body = await req.json();
    const parsed = InitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: "invalid_request", message: parsed.error.issues[0]?.message } }, { status: 400 });
    }
    const { filename, contentType, size } = parsed.data;

    const s3 = getS3();
    if (!s3) return NextResponse.json({ error: { code: "s3_not_configured" } }, { status: 501 });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${ctx.userId}/${Date.now()}-${safeName}`;

    const init = await s3.send(new CreateMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET!, Key: key, ContentType: contentType,
    }));
    const uploadId = init.UploadId!;

    uploadStore.set(uploadId, { parts: [], key, contentType, userId: ctx.userId, fileName: filename, startedAt: Date.now() });

    logger.info({ userId: ctx.userId, uploadId, key, size, contentType }, "multipart upload initiated");

    return NextResponse.json({
      uploadId, key, partSize: PART_SIZE, totalParts: Math.ceil(size / PART_SIZE),
    });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    logger.error({ err }, "multipart init failed");
    return errorResponse(err as Error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ uploadId: string }> }) {
  try {
    const ctx = await requireAuth(req);
    const { uploadId } = await params;
    const state = uploadStore.get(uploadId);
    if (!state || state.userId !== ctx.userId) {
      return NextResponse.json({ error: { code: "upload_not_found" } }, { status: 404 });
    }

    const s3 = getS3();
    if (!s3) return NextResponse.json({ error: { code: "s3_not_configured" } }, { status: 501 });

    // Import UploadPartCommand at runtime to keep top-level light
    const completeBody = await req.json() as { parts?: { PartNumber?: number; ETag?: string; partNumber?: number; etag?: string }[] };
    const parts = (completeBody.parts || state.parts).map(p => ({
      PartNumber: p.PartNumber ?? p.partNumber!,
      ETag: p.ETag ?? p.etag!,
    }));

    await s3.send(new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET!, Key: state.key, UploadId: uploadId,
      MultipartUpload: { Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    }));

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const queue = getDocumentQueue();
    if (queue) {
      await queue.add("parse-document", {
        documentId, userId: ctx.userId, filePath: state.key,
        fileName: state.fileName, mimeType: state.contentType,
      });
    }

    uploadStore.delete(uploadId);
    logger.info({ uploadId, documentId, userId: ctx.userId }, "multipart upload completed + queued");
    return NextResponse.json({
      documentId, key: state.key, status: "queued",
      message: "Document uploaded. Parsing will begin shortly.",
    });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    logger.error({ err }, "multipart complete failed");
    return errorResponse(err as Error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ uploadId: string }> }) {
  try {
    const ctx = await requireAuth(req);
    const { uploadId } = await params;
    const state = uploadStore.get(uploadId);
    if (!state || state.userId !== ctx.userId) {
      return NextResponse.json({ error: { code: "upload_not_found" } }, { status: 404 });
    }
    const s3 = getS3();
    if (s3) {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: process.env.S3_BUCKET!, Key: state.key, UploadId: uploadId,
      }));
    }
    uploadStore.delete(uploadId);
    logger.info({ uploadId, userId: ctx.userId }, "multipart upload aborted");
    return NextResponse.json({ status: "aborted" });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    logger.error({ err }, "multipart abort failed");
    return errorResponse(err as Error);
  }
}
