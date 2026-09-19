/**
 * Structured logging — pino with JSON output in prod, pretty-print in dev.
 *
 * Phase 7: replaces console.log/error across the codebase.
 * Redacts known secret fields to prevent accidental leakage.
 */
import pino, { Logger } from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  base: {
    service: "artha-api",
    env: process.env.NODE_ENV || "development",
  },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.jwt",
      "*.secret",
      "*.Authorization",
      "*.authorization",
      "req.headers.authorization",
      "req.headers.cookie",
      "*.refreshToken",
      "*.accessToken",
    ],
    censor: "[REDACTED]",
  },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,service,env",
        },
      },
  // Use safe JSON in prod; allow circular refs in dev
  safe: isProd,
});

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}
