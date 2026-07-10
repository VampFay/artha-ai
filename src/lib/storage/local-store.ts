/**
 * LocalFileStore — local filesystem storage (dev only).
 * Production uses S3FileStore.
 */

import { promises as fs } from "fs";
import path from "path";
import { FileStore } from "./file-store";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export class LocalFileStore implements FileStore {
  constructor() {
    // Ensure upload dir exists
    fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});
  }

  async save(key: string, buffer: Buffer, _contentType: string): Promise<string> {
    const fullPath = path.join(UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return key;
  }

  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(UPLOAD_DIR, key);
    return fs.readFile(fullPath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(UPLOAD_DIR, key);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(UPLOAD_DIR, key);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, _expirySeconds?: number): Promise<string> {
    // Local dev: return a direct URL
    return `/uploads/${key}`;
  }
}
