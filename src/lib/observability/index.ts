/**
 * Observability & Monitoring
 * --------------------------
 * Structured logging, error tracking, and metrics collection.
 * Integrates with Sentry (production) and console (dev).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  tenantId?: string;
  entityId?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Structured logger — outputs JSON in production, colored console in dev.
 */
export class Logger {
  private static instance: Logger;
  private sentryInitialized = false;

  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  private constructor() {
    // Initialize Sentry if DSN is set
    if (process.env.SENTRY_DSN) {
      this.sentryInitialized = true;
      // Dynamic import to avoid bundling Sentry in dev
      import("@sentry/nextjs").then(Sentry => {
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
          tracesSampleRate: 0.1,
        });
      }).catch(() => {});
    }
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log("warn", message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    this.log("error", message, { ...metadata, error: error?.message, stack: error?.stack });

    // Send to Sentry
    if (this.sentryInitialized && error) {
      import("@sentry/nextjs").then(Sentry => {
        Sentry.captureException(error, { extra: metadata });
      }).catch(() => {});
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    if (process.env.NODE_ENV === "production") {
      // JSON output for log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // Colored console output for dev
      const colors: Record<LogLevel, string> = {
        debug: "\x1b[36m", // cyan
        info: "\x1b[32m",  // green
        warn: "\x1b[33m",  // yellow
        error: "\x1b[31m", // red
      };
      const reset = "\x1b[0m";
      const time = entry.timestamp.substring(11, 19);
      console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${time} ${message}${metadata ? ` ${JSON.stringify(metadata)}` : ""}`);
    }
  }

  /**
   * Wrap an async function with logging + timing.
   */
  async track<T>(
    action: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(action, { duration, ...metadata, status: "success" });
      return result;
    } catch (err: any) {
      const duration = Date.now() - start;
      this.error(`${action} failed`, err, { duration, ...metadata, status: "error" });
      throw err;
    }
  }
}

export const logger = Logger.getInstance();

/**
 * Metrics collector (for Prometheus/Grafana).
 */
export class Metrics {
  private static counters = new Map<string, number>();
  private static histograms = new Map<string, number[]>();

  static incrementCounter(name: string, value: number = 1): void {
    const current = Metrics.counters.get(name) || 0;
    Metrics.counters.set(name, current + value);
  }

  static recordHistogram(name: string, value: number): void {
    if (!Metrics.histograms.has(name)) Metrics.histograms.set(name, []);
    Metrics.histograms.get(name)!.push(value);
  }

  static getMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [name, value] of Metrics.counters) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    }

    // Histograms (simplified — just p50, p95, p99)
    for (const [name, values] of Metrics.histograms) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      lines.push(`# TYPE ${name} histogram`);
      lines.push(`${name}_p50 ${p50}`);
      lines.push(`${name}_p95 ${p95}`);
      lines.push(`${name}_p99 ${p99}`);
      lines.push(`${name}_count ${sorted.length}`);
    }

    return lines.join("\n");
  }
}
