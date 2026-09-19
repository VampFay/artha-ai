import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  productionBrowserSourceMaps: true, // enable for Sentry source maps (Phase 7)
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "pdfkit",
    "pdf-parse",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "@aws-sdk/client-ses",
    "@aws-sdk/client-kms",
    "@aws-sdk/client-secrets-manager",
    "@sentry/nextjs",
    "ioredis",
    "bullmq",
    "pino",
    "socket.io",
    "papa-parse",
    "xlsx",
  ],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        // Phase 9 — security headers
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-DNS-Prefetch-Control", value: "off" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        { key: "Content-Security-Policy", value: process.env.NODE_ENV === "production"
          ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.openai.com https://sentry.io; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
          : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.openai.com https://sentry.io ws: wss:; font-src 'self' data: https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
      ],
    }];
  },
  // Phase 5 — proxy/middleware deprecated, will move to src/proxy.ts in Next 17
  // (For now middleware.ts still works but emits deprecation warning in build)
};

// Phase 7 — Sentry wrap (no-op if SENTRY_DSN not set)
let exportedConfig = nextConfig;
try {
  if (process.env.SENTRY_DSN && process.env.SENTRY_AUTH_TOKEN) {
    // Dynamic import to avoid bundling Sentry in dev/test
    const { withSentryConfig } = require("@sentry/nextjs");
    exportedConfig = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      sourcemaps: { disable: false },
      // Only upload sourcemaps on prod builds
      disableServerWebpackPlugin: process.env.NODE_ENV !== "production",
      disableClientWebpackPlugin: process.env.NODE_ENV !== "production",
    });
  }
} catch (err) {
  // Sentry optional — fall through
  console.warn("[sentry] not configured, skipping wrap");
}

export default exportedConfig;
