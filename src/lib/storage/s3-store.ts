/**
 * S3FileStore — stores files on S3 (or S3-compatible: R2, MinIO, etc.)
 * Used in production. Requires S3_* env vars.
 */

import type { FileStore } from "./file-store";

export class S3FileStore implements FileStore {
  private bucket: string;
  private client: any;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    if (!bucket) throw new Error("S3_BUCKET env var required when STORAGE_DRIVER=s3");

    this.bucket = bucket;

    // Lazy-load AWS SDK
    const { S3Client } = require("@aws-sdk/client-s3");
    this.client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      credentials: process.env.S3_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY || "",
          }
        : undefined,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: !!process.env.S3_ENDPOINT, // R2/MinIO need path-style
    });
  }

  async save(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return `s3://${this.bucket}/${key}`;
  }

  async read(key: string): Promise<Buffer> {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const cleanKey = key.startsWith("s3://") ? key.replace(`s3://${this.bucket}/`, "") : key;
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: cleanKey })
    );
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      const cleanKey = key.startsWith("s3://") ? key.replace(`s3://${this.bucket}/`, "") : key;
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: cleanKey })
      );
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const { HeadObjectCommand } = require("@aws-sdk/client-s3");
      const cleanKey = key.startsWith("s3://") ? key.replace(`s3://${this.bucket}/`, "") : key;
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: cleanKey })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const cleanKey = key.startsWith("s3://") ? key.replace(`s3://${this.bucket}/`, "") : key;
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: cleanKey });
    return getSignedUrl(this.client, command, { expiresIn: expirySeconds });
  }
}
