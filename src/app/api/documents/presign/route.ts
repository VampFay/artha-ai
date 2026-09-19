/**
 * Presigned upload URL — direct browser-to-S3 upload (bypasses server for large files).
 *
 * Phase 3 — cuts server bandwidth + CPU; client PUTs file directly to S3
 * with a 5-minute signed URL, then POSTs the resulting key to /api/documents
 * for parsing.
 *
 * Returns: { url, key, expiresAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAuth, errorResponse, AuthError } from "@/lib/security/middleware";
import { enforceRateLimit, RateLimitPolicies } from "@/lib/security/rate-limit";
import { logger } from "@/lib/logger";
import { z as Z } from "zod";

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/webp",
];

const PresignSchema = Z.object({
  filename: Z.string().min(1).max(255),
  contentType: Z.string().min(1).max(100),
  size: Z.number().int().positive().max(MAX_SIZE),
});

export async function POST(req: NextRequest) {
  try {
    // Throws AuthError(401) if not authenticated — errorResponse handles it below
    const ctx = await requireAuth(req);

    // Rate limit per user
    const limited = await enforceRateLimit(
      req,
      "presign",
      RateLimitPolicies.UPLOAD,
      ctx.userId,
    );
    if (limited) return limited;

    const body = await req.json();
    const parsed = PresignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "invalid_request", message: parsed.error.issues[0]?.message } },
        { status: 400 },
      );
    }
    const { filename, contentType, size } = parsed.data;

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: { code: "unsupported_type", message: `Allowed: ${ALLOWED_TYPES.join(", ")}` } },
        { status: 415 },
      );
    }

    if (process.env.STORAGE_DRIVER !== "s3") {
      return NextResponse.json(
        { error: { code: "s3_not_configured", message: "Presigned uploads require STORAGE_DRIVER=s3" } },
        { status: 501 },
      );
    }

    const bucket = process.env.S3_BUCKET!;
    const region = process.env.S3_REGION!;
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const accessKey = process.env.S3_ACCESS_KEY!;
    const secretKey = process.env.S3_SECRET_KEY!;

    if (!bucket || !accessKey || !secretKey) {
      return NextResponse.json(
        { error: { code: "s3_misconfigured", message: "S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY must be set" } },
        { status: 500 },
      );
    }

    const client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${ctx.userId}/${Date.now()}-${safeFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const url = await getSignedUrl(client, command, { expiresIn: 300 });
    const expiresAt = Date.now() + 300 * 1000;

    logger.info({ userId: ctx.userId, key, contentType, size }, "presigned upload");

    return NextResponse.json({ url, key, expiresAt });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err);
    }
    logger.error({ err }, "presign failed");
    return errorResponse(err as Error);
  }
}
