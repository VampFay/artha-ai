/**
 * OpenTelemetry SDK + distributed tracing across API routes, Prisma, Redis, LLM.
 *
 * WP3.1 — Tracing & monitoring.
 *
 * Architecture:
 *   - NodeSDK initializes auto-instrumentations (http, fs, dns, net, pg, redis)
 *   - Custom span creators for API routes / LLM calls / business logic
 *   - Traces exported via OTLP/HTTP to Sentry / Grafana Tempo / Honeycomb / etc.
 *
 * Usage:
 *   import { tracer, withSpan } from "@/lib/telemetry";
 *   await withSpan("api.auth.login", async (span) => { ... });
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION, ATTR_DEPLOYMENT_ENVIRONMENT_NAME } from "@opentelemetry/semantic-conventions";
import { trace, context, Span, SpanStatusCode, Tracer } from "@opentelemetry/api";
import { logger } from "@/lib/logger";

let sdk: NodeSDK | null = null;
let initialized = false;

/**
 * Initialize the OpenTelemetry SDK. Call once at app startup
 * (in instrumentation.ts or worker entry point).
 */
export function initTelemetry(): void {
  if (initialized) return;
  initialized = true;

  const exporterUrl = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!exporterUrl) {
    logger.info({}, "OpenTelemetry disabled — OTEL_EXPORTER_OTLP_ENDPOINT not set");
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "artha-api",
    [ATTR_SERVICE_VERSION]: "0.2.0",
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: process.env.NODE_ENV || "development",
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${exporterUrl}/v1/traces`,
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : {},
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${exporterUrl}/v1/metrics`,
    headers: processEnvHeaders(),
  });

  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false }, // too noisy
        "@opentelemetry/instrumentation-dns": { enabled: false },
      }),
    ],
  });

  sdk.start();
  logger.info({ exporterUrl }, "OpenTelemetry SDK started");

  // Graceful shutdown
  for (const sig of ["SIGTERM", "SIGINT"]) {
    process.on(sig, async () => {
      try {
        await sdk?.shutdown();
        logger.info({}, "OpenTelemetry SDK shutdown complete");
      } catch (err) {
        logger.error({ err }, "OpenTelemetry shutdown error");
      }
      process.exit(0);
    });
  }
}

function processEnvHeaders(): Record<string, string> {
  if (!process.env.OTEL_EXPORTER_OTLP_HEADERS) return {};
  try {
    return JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS);
  } catch {
    // Support "key1=val1,key2=val2" format too
    const headers: Record<string, string> = {};
    for (const kv of process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",")) {
      const [k, v] = kv.split("=");
      if (k && v) headers[k.trim()] = v.trim();
    }
    return headers;
  }
}

/**
 * Get the global tracer.
 */
export function getTracer(): Tracer {
  return trace.getTracer("artha-api", "0.2.0");
}

/**
 * Wrap an async function in a span.
 *
 * Usage:
 *   const result = await withSpan("api.documents.upload", async (span) => {
 *     span.setAttribute("user.id", userId);
 *     span.setAttribute("file.size", size);
 *     return await processUpload();
 *   });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) {
      for (const [k, v] of Object.entries(attributes)) {
        span.setAttribute(k, v);
      }
    }
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (err as Error).message,
      });
      span.recordException(err as Error);
      throw err;
    } finally {
      span.end();
    }
  });
}

/**
 * Add an event to the current active span (for correlation in traces).
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.addEvent(name, attributes);
  }
}

/**
 * Set attribute on the current active span.
 */
export function setSpanAttribute(key: string, value: string | number | boolean): void {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.setAttribute(key, value);
  }
}

/**
 * Get the current trace ID — useful for log correlation.
 * Format: 32-char hex string.
 */
export function getCurrentTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (!span) return undefined;
  const ctx = span.spanContext();
  return ctx.traceId;
}

// Re-export for advanced usage
export { context, trace };
