/**
 * BullMQ queues for async background processing.
 *
 * Phase 5: document parsing (PDF/CSV/XLSX) and report generation (PDF)
 * are long-running (5–30s) and MUST be offloaded from the request thread
 * to a worker process. POST /api/documents and POST /api/reports return
 * 202 Accepted + jobId immediately; frontend polls status endpoints.
 */
import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

// Lazy-init — queues connect to Redis only when first used
let documentQueue: Queue | null = null;
let reportQueue: Queue | null = null;

function getQueue(name: string): Queue | null {
  const redis = getRedis();
  if (!redis) return null;
  // BullMQ accepts a Redis instance directly (will share the connection)
  const connection = redis as unknown as Queue["opts"]["connection"];
  if (name === "documents" && !documentQueue) {
    documentQueue = new Queue("documents", { connection });
  }
  if (name === "reports" && !reportQueue) {
    reportQueue = new Queue("reports", { connection });
  }
  return name === "documents" ? documentQueue : reportQueue;
}

export function getDocumentQueue(): Queue | null {
  return getQueue("documents");
}

export function getReportQueue(): Queue | null {
  return getQueue("reports");
}

export interface DocumentJobData {
  documentId: string;
  userId: string;
  filePath: string;
  fileName: string;
  mimeType: string;
}

export interface ReportJobData {
  jobId: string;
  userId: string;
  reportType: "tax_summary" | "portfolio" | "cashflow" | "annual";
  dateRange: { from: string; to: string };
  format: "pdf" | "csv";
}
