/**
 * Single-part upload — used for chunked PUTs from the client.
 * WP2.1 — supports resumable chunked uploads for files >5MB.
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, UploadPartCommand } from "@aws-sdk/client-s3";
import { requireAuth, errorResponse, AuthError } from "@/lib/security/middleware";
import { logger } from "@/lib/logger";

const MAX_PARTS = 1000;

// Shared state — import the uploadState map from the parent route
// (in prod, use Redis to share state across instances)
import { uploadStore } from "@/lib/realtime/upload-store";

function getS3() {
  if (process.env.STORAGE_DRIVER !== "s3") return null;
  return new S3Client({
    region: process.env.S3_REGION!,
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ uploadId: string; partNumber: string }> }) {
  try {
    const ctx = await requireAuth(req);
    const { uploadId, partNumber } = await params;
    const partNum = parseInt(partNumber, 10);
    if (!Number.isInteger(partNum) || partNum < 1 || partNum > MAX_PARTS) {
      return NextResponse.json({ error: { code: "invalid_part_number" } }, { status: 400 });
    }

    const state = uploadStore.get(uploadId);
    if (!state || state.userId !== ctx.userId) {
      return NextResponse.json({ error: { code: "upload_not_found" } }, { status: 404 });
    }

    const s3 = getS3();
    if (!s3) return NextResponse.json({ error: { code: "s3_not_configured" } }, { status: 501 });

    const body = await req.arrayBuffer();
    if (body.byteLength === 0) {
      return NextResponse.json({ error: { code: "empty_part" } }, { status: 400 });
    }

    const result = await s3.send(new UploadPartCommand({
      Bucket: process.env.S3_BUCKET!, Key: state.key, UploadId: uploadId,
      PartNumber: partNum, Body: new Uint8Array(body),
    }));

    state.parts.push({ partNumber: partNum, etag: result.ETag! });
    logger.debug({ uploadId, partNum, size: body.byteLength }, "multipart part uploaded");

    return NextResponse.json({ partNumber: partNum, etag: result.ETag });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    logger.error({ err }, "multipart part upload failed");
    return errorResponse(err as Error);
  }
}
