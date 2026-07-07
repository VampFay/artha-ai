/**
 * Redis client — singleton with in-memory fallback.
 * If REDIS_URL is set, uses Redis. Otherwise, falls back to in-memory Map.
 * Used for rate limiting, caching, and job queues.
 */

import type { NextRequest } from "next/server";

let redisClient: any = null;
let useInMemory = false;

// In-memory fallback store
const memStore = new Map<string, { value: string; expiresAt: number }>();

function getRedis() {
  if (redisClient !== null) return redisClient;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    useInMemory = true;
    return null;
  }

  try {
    // Lazy-load ioredis
    const Redis = require("ioredis").default;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 1000),
      lazyConnect: false,
    });

    redisClient.on("error", (err: Error) => {
      console.error("Redis error, falling back to in-memory:", err.message);
      useInMemory = true;
    });

    redisClient.on("connect", () => {
      console.log("Redis connected ✓");
      useInMemory = false;
    });

    return redisClient;
  } catch {
    useInMemory = true;
    return null;
  }
}

/**
 * Increment a key and return the new value.
 * Uses Redis INCR + EXPIRE, or in-memory fallback.
 */
export async function incrWithExpiry(key: string, windowSeconds: number): Promise<number> {
  const redis = getRedis();

  if (redis && !useInMemory) {
    try {
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds, "NX"); // Only set expiry if key is new
      const results = await pipeline.exec();
      return results[0][1] as number;
    } catch {
      useInMemory = true;
    }
  }

  // In-memory fallback
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || now > entry.expiresAt) {
    memStore.set(key, { value: "1", expiresAt: now + windowSeconds * 1000 });
    // Cleanup: remove expired entries every 100 calls
    if (Math.random() < 0.01) cleanupExpired();
    return 1;
  }
  const newVal = parseInt(entry.value) + 1;
  entry.value = String(newVal);
  return newVal;
}

/**
 * Check rate limit using Redis or in-memory.
 * @returns true if allowed, false if rate-limited
 */
export async function checkRateLimitAsync(
  key: string,
  max: number,
  windowMs: number
): Promise<boolean> {
  const count = await incrWithExpiry(key, Math.ceil(windowMs / 1000));
  return count <= max;
}

/**
 * Synchronous rate limit check (in-memory only — for backward compat).
 * Prefer checkRateLimitAsync for Redis support.
 */
const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

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
 * Cleanup expired entries from in-memory store.
 * Called periodically to prevent memory leaks.
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (now > entry.expiresAt) memStore.delete(key);
  }
  for (const [key, entry] of RATE_LIMITS) {
    if (now > entry.resetAt) RATE_LIMITS.delete(key);
  }
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
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
