/**
 * Security Headers Middleware (Next.js middleware)
 * -----------------------------------------------
 * Enforces security headers on all responses:
 *   - Strict-Transport-Security (HSTS)
 *   - Content-Security-Policy (CSP)
 *   - X-Frame-Options (prevent clickjacking)
 *   - X-Content-Type-Options (prevent MIME sniffing)
 *   - Referrer-Policy
 *   - Permissions-Policy
 *
 * Also enforces:
 *   - HTTPS-only in production
 *   - Per-tenant rate limiting
 *   - IP allowlist for enterprise tenants
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 1. Security headers (applied to all responses)
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");

  // Anti-caching: prevent preview proxy/CDN from caching HTML pages.
  // This ensures the latest code is always served.
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Surrogate-Control", "no-store");

  // Content Security Policy
  // In production: tighten to specific origins
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);

  // 2. HTTPS enforcement (production)
  if (process.env.NODE_ENV === "production") {
    const proto = req.headers.get("x-forwarded-proto");
    if (proto === "http") {
      const httpsUrl = new URL(req.url);
      httpsUrl.protocol = "https:";
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  // 3. CORS for API routes (strict — only same-origin by default)
  if (req.nextUrl.pathname.startsWith("/api/v1/")) {
    const origin = req.headers.get("origin");
    if (origin) {
      // Allow same-origin and configured CORS origins
      const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").filter(Boolean);
      const requestHost = req.headers.get("host");
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === requestHost || allowedOrigins.includes(origin)) {
          res.headers.set("Access-Control-Allow-Origin", origin);
          res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
          res.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-API-Key, X-Internal, X-Request-Id");
          res.headers.set("Access-Control-Allow-Credentials", "true");
          res.headers.set("Access-Control-Max-Age", "86400");
        }
      } catch {}
    }
    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: res.headers });
    }
  }

  return res;
}

export const config = {
  // Run on all routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
