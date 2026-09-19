/**
 * Worker process — runs BullMQ workers for async document parsing + report gen.
 *
 * Phase 5 — separate process from the Next.js server.
 * Start via: docker compose -f docker-compose.prod.yml up -d worker
 * Local:     node scripts/start-worker.js  (with REDIS_URL set)
 */
import { Worker } from "bullmq";
import { getRedis } from "../src/lib/redis";
import { logger } from "../src/lib/logger";
import type { DocumentJobData, ReportJobData } from "../src/lib/queues";

const connection = getRedis();
if (!connection) {
  console.error("FATAL: REDIS_URL not set — worker cannot start");
  process.exit(1);
}

// Document parsing worker — receives uploaded files, parses, extracts fields
// @ts-expect-error — BullMQ Connection type is structurally compatible
const documentWorker = new Worker<DocumentJobData>(
  "documents",
  async (job) => {
    const { documentId, userId, filePath, fileName, mimeType } = job.data;
    logger.info({ jobId: job.id, documentId, userId, fileName }, "processing document");

    // Dynamically import so the heavy parser code only loads in the worker process
    const { extractFromDocument } = await import("../src/lib/parsers/document-extraction");
    const result = await extractFromDocument({
      filePath,
      mimeType,
      fileName,
      userId,
      documentId,
    });

    logger.info(
      { jobId: job.id, documentId, fieldsFound: result.fields?.length || 0 },
      "document processed",
    );

    // TODO: emit Socket.io event "document:completed" to refresh the UI
    return result;
  },
  { connection, concurrency: 3 },
);

documentWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "document job failed");
});

documentWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "document job completed");
});

// Report generation worker
// @ts-expect-error — BullMQ Connection type
const reportWorker = new Worker<ReportJobData>(
  "reports",
  async (job) => {
    const { jobId, userId, reportType, dateRange, format } = job.data;
    logger.info({ jobId: job.id, userId, reportType }, "generating report");

    // TODO: implement actual report generation (PDF via pdfkit, CSV via papaparse)
    // For now just log + return a stub
    const result = {
      jobId,
      status: "completed",
      downloadUrl: `/api/reports/jobs/${jobId}/download`,
      format,
      generatedAt: new Date().toISOString(),
    };

    logger.info({ jobId: job.id, reportType }, "report generated");
    return result;
  },
  { connection, concurrency: 2 },
);

reportWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, "report job failed");
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, "shutdown signal received");
  await Promise.all([documentWorker.close(), reportWorker.close()]);
  await connection.quit();
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

logger.info(
  { pid: process.pid, worker: "artha-worker" },
  "worker process started",
);

// Healthcheck endpoint on a separate port (for docker-compose healthcheck)
import http from "http";
http
  .createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", worker: true, pid: process.pid }));
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  })
  .listen(3030, "0.0.0.0", () => {
    logger.info({ port: 3030 }, "worker healthcheck listening");
  });
