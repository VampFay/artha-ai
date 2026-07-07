/**
 * FileStore — abstraction layer for file storage.
 * Implementations: LocalFileStore (dev), S3FileStore (prod).
 */

export interface FileStore {
  /** Save a file. Returns the storage key (path or S3 key). */
  save(key: string, buffer: Buffer, contentType: string): Promise<string>;

  /** Read a file. Returns the file buffer. */
  read(key: string): Promise<Buffer>;

  /** Delete a file. Returns true if deleted, false if not found. */
  delete(key: string): Promise<boolean>;

  /** Check if a file exists. */
  exists(key: string): Promise<boolean>;

  /** Get a signed URL for temporary access (S3) or a local path (local). */
  getSignedUrl(key: string, expirySeconds?: number): Promise<string>;
}

let storeInstance: FileStore | null = null;

export function getFileStore(): FileStore {
  if (storeInstance) return storeInstance;

  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3") {
    // Lazy-load S3 to avoid importing AWS SDK in dev mode
    const { S3FileStore } = require("./s3-store");
    storeInstance = new S3FileStore();
  } else {
    const { LocalFileStore } = require("./local-store");
    storeInstance = new LocalFileStore();
  }

  return storeInstance;
}
