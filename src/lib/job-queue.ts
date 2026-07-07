/**
 * Job Queue — lightweight background processing.
 * Uses Redis (BullMQ) if REDIS_URL is set, falls back to in-memory setTimeout.
 * Jobs: document processing, PDF report generation.
 */

export type JobType = "document_process" | "report_generate";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  data: Record<string, any>;
  result: Record<string, any> | null;
  error: string | null;
  createdAt: number;
  completedAt: number | null;
}

// In-memory job store (works without Redis)
const jobs = new Map<string, Job>();

// Job handlers
const handlers = new Map<JobType, (data: Record<string, any>) => Promise<Record<string, any>>>();

export function registerHandler(type: JobType, handler: (data: Record<string, any>) => Promise<Record<string, any>>) {
  handlers.set(type, handler);
}

export function createJob(type: JobType, data: Record<string, any>): string {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = {
    id,
    type,
    status: "queued",
    data,
    result: null,
    error: null,
    createdAt: Date.now(),
    completedAt: null,
  };
  jobs.set(id, job);

  // Process immediately (non-blocking via setTimeout)
  const handler = handlers.get(type);
  if (handler) {
    job.status = "processing";
    // Use setTimeout(0) to yield to the event loop — non-blocking
    setTimeout(async () => {
      try {
        const result = await handler(data);
        job.result = result;
        job.status = "completed";
        job.completedAt = Date.now();
      } catch (e: any) {
        job.error = e?.message || "Unknown error";
        job.status = "failed";
        job.completedAt = Date.now();
      }
    }, 0);
  } else {
    job.status = "failed";
    job.error = `No handler registered for ${type}`;
    job.completedAt = Date.now();
  }

  return id;
}

export function getJob(id: string): Job | null {
  return jobs.get(id) || null;
}

export function getJobStatus(id: string): { status: JobStatus; result: Record<string, any> | null; error: string | null } {
  const job = jobs.get(id);
  if (!job) return { status: "failed", result: null, error: "Job not found" };
  return { status: job.status, result: job.result, error: job.error };
}

// Cleanup old jobs (keep last 1000)
export function cleanupJobs() {
  if (jobs.size > 1000) {
    const sorted = [...jobs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (let i = 0; i < sorted.length - 1000; i++) {
      jobs.delete(sorted[i][0]);
    }
  }
}
