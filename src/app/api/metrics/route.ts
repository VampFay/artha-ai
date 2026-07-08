import { NextResponse } from "next/server";

/**
 * GET /api/metrics — Prometheus-format metrics.
 * Basic counters for request tracking (upgrade to prom-client for full metrics).
 */

// In-memory counters (reset on restart — use Redis for persistence)
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

export function recordRequest() { requestCount++; }
export function recordError() { errorCount++; }

export async function GET() {
  const uptime = (Date.now() - startTime) / 1000;
  const memUsage = process.memoryUsage();

  const metrics = [
    `# HELP artha_requests_total Total number of requests`,
    `# TYPE artha_requests_total counter`,
    `artha_requests_total ${requestCount}`,
    ``,
    `# HELP artha_errors_total Total number of errors`,
    `# TYPE artha_errors_total counter`,
    `artha_errors_total ${errorCount}`,
    ``,
    `# HELP artha_uptime_seconds Server uptime in seconds`,
    `# TYPE artha_uptime_seconds gauge`,
    `artha_uptime_seconds ${uptime.toFixed(0)}`,
    ``,
    `# HELP artha_memory_heap_used_bytes Heap memory used`,
    `# TYPE artha_memory_heap_used_bytes gauge`,
    `artha_memory_heap_used_bytes ${memUsage.heapUsed}`,
    ``,
    `# HELP artha_memory_heap_total_bytes Heap memory total`,
    `# TYPE artha_memory_heap_total_bytes gauge`,
    `artha_memory_heap_total_bytes ${memUsage.heapTotal}`,
    ``,
    `# HELP artha_memory_rss_bytes RSS memory`,
    `# TYPE artha_memory_rss_bytes gauge`,
    `artha_memory_rss_bytes ${memUsage.rss}`,
  ].join("\n");

  return new NextResponse(metrics, {
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
}
