/**
 * Redis singleton with in-memory fallback for dev.
 * Used by rate limiting (Phase 5) and BullMQ queues (Phase 5).
 */
import Redis from "ioredis";

let redis: Redis | null = null;
let connectionAttempts = 0;

export function getRedis(): Redis | null {
  if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    console.warn("[redis] REDIS_URL not set in production — running in degraded mode");
  }
  if (redis) return redis;
  if (!process.env.REDIS_URL) return null;
  if (connectionAttempts > 3) return null; // give up after 3 fails

  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    redis.on("error", (err) => {
      console.error("[redis] error:", err.message);
      connectionAttempts++;
    });
    redis.on("connect", () => {
      connectionAttempts = 0;
    });
    return redis;
  } catch (err) {
    console.error("[redis] init failed:", err);
    connectionAttempts++;
    return null;
  }
}

export async function pingRedis(): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  try {
    const pong = await r.ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
