/**
 * Rate limiting — Redis-backed (production) with in-memory fallback (dev).
 *
 * Phase 5: wired into POST routes via `requireAuth()` middleware.
 *
 * Sliding window: increments a counter per (key, window) using Redis INCR
 * + EXPIRE. In dev without REDIS_URL, falls back to a Map.
 */
import { getRedis } from "@/lib/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  limit: number;
}

/**
 * Check rate limit for a given key.
 *
 * @param key      Unique identifier — usually `${route}:${userId|ip}`
 * @param limit    Max requests allowed in window
 * @param windowSec Window size in seconds
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (redis) {
    // Sliding window via Redis INCR + EXPIRE
    const k = `rl:${key}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    const ttl = await redis.ttl(k);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + Math.max(ttl, 0) * 1000,
      limit,
    };
  }

  // In-memory fallback (dev only — does NOT work in multi-instance deploys)
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowSec * 1000 };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowSec * 1000;
  }
  bucket.count++;
  buckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit,
  };
}

/**
 * Standard rate limit policies — apply per route type.
 */
export const RateLimitPolicies = {
  AUTH: { limit: 10, windowSec: 60 },          // login/register: 10/min
  AUTH_STRICT: { limit: 5, windowSec: 900 },   // login attempts: 5 per 15 min (lockout)
  API: { limit: 60, windowSec: 60 },            // general API: 60/min
  AI: { limit: 20, windowSec: 60 },            // AI/assistant: 20/min
  UPLOAD: { limit: 30, windowSec: 3600 },      // file uploads: 30/hour per user
  REPORT: { limit: 10, windowSec: 3600 },      // report gen: 10/hour per user
  EXPORT: { limit: 5, windowSec: 3600 },       // data export: 5/hour per user
} as const;

/**
 * Express/Next.js middleware helper — call from any POST handler.
 *
 * Returns null if allowed, otherwise a Response to send to the client.
 */
export async function enforceRateLimit(
  req: Request,
  keyPrefix: string,
  policy: { limit: number; windowSec: number },
  identifier: string,
): Promise<Response | null> {
  const result = await checkRateLimitAsync(
    `${keyPrefix}:${identifier}`,
    policy.limit,
    policy.windowSec,
  );
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: "rate_limit_exceeded",
        message: `Too many requests. Try again in ${retryAfter}s.`,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
        },
      },
    );
  }
  return null;
}
