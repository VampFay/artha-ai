/**
 * Upload state store — abstracted so we can swap in-memory for Redis
 * in production without changing call sites.
 *
 * WP2.1 — shared across instances via Redis pub/sub in prod.
 */
export interface UploadState {
  parts: { partNumber: number; etag: string }[];
  key: string;
  contentType: string;
  userId: string;
  fileName: string;
  startedAt: number;
}

// In-memory fallback (dev only — broken across instances)
const memStore = new Map<string, UploadState>();

export const uploadStore = {
  get: (id: string): UploadState | undefined => memStore.get(id),
  set: (id: string, state: UploadState): void => { memStore.set(id, state); },
  delete: (id: string): void => { memStore.delete(id); },
  size: (): number => memStore.size,
};
