import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiter utility — in-memory sliding window.
 * Works for single-instance deployments (FYP scope).
 * Upgrade path: Redis INCR+EXPIRE for multi-instance.
 */

const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given key.
 * @param key - Unique identifier (e.g., `login:${ip}` or `llm:${userId}`)
 * @param max - Maximum requests in window
 * @param windowMs - Window duration in milliseconds
 * @returns true if request is allowed, false if rate-limited
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = RATE_LIMITS.get(key);
  if (!entry || now > entry.resetAt) {
    RATE_LIMITS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/**
 * Extract client IP from request, respecting X-Forwarded-For.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Validate Origin header for CSRF protection on state-changing requests.
 * Returns true if the origin is allowed.
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  // Allow same-origin requests (origin matches host)
  if (!origin) return true; // Non-browser clients (curl, etc.) — rely on Bearer token
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
