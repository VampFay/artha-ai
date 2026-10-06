/**
 * Next.js instrumentation.ts — runs before any other code at app startup.
 * Initializes OpenTelemetry.
 *
 * WP3.1 — Distributed tracing across the entire request lifecycle.
 *
 * This file is automatically loaded by Next.js when present at src/instrumentation.ts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTelemetry } = await import("@/lib/telemetry");
    initTelemetry();
  }
}
