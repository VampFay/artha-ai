/**
 * Anti-DoS Authentication Rate Limiter
 * ------------------------------------
 * WP2.3 — Pre-bcrypt Redis evaluation + IP ban triggers.
 *
 * Problem solved:
 *   bcrypt.compare (cost 12) takes ~250ms CPU per request.
 *   Unthrottled login = attacker can starve CPU with 1000 req/s.
 *
 * Architecture:
 *   1. IP-level sliding window (10 logins/min/IP) — checked BEFORE bcrypt
 *   2. Identity-level sliding window (5 logins/min/email) — checked BEFORE bcrypt
 *   3. IP ban trigger: 20 failed auth attempts in 15 min → ban IP 1 hour
 *   4. Account lockout: 5 failed attempts in 15 min → lock account 15 min
 */
import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// Rate limit windows
const IP_WINDOW_SEC = 60;          // 1 minute
const IP_MAX_PER_WINDOW = 10;      // 10 logins/min per IP
const IDENTITY_WINDOW_SEC = 60;    // 1 minute
const IDENTITY_MAX_PER_WINDOW = 5; // 5 logins/min per email

// Ban thresholds
const IP_FAIL_BAN_THRESHOLD = 20;     // 20 fails in 15 min → ban
const IP_FAIL_BAN_WINDOW_SEC = 900;   // 15 min rolling window
const IP_BAN_DURATION_SEC = 3600;     // 1 hour ban
const ACCT_FAIL_LOCK_THRESHOLD = 5;   // 5 fails in 15 min → lock
const ACCT_FAIL_LOCK_WINDOW_SEC = 900;
const ACCT_LOCK_DURATION_SEC = 900;   // 15 min lockout

const ipFailKey = (ip: string) => `auth:fail:ip:${ip}`;
const idFailKey = (email: string) => `auth:fail:id:${cryptoHash(email)}`;
const ipBanKey = (ip: string) => `auth:ban:ip:${ip}`;
const acctLockKey = (userId: string) => `auth:lock:acct:${userId}`;

// Hash email/IP for storage (don't store raw PII in Redis keys)
function cryptoHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

// In-memory fallback for dev (no Redis)
const memBuckets = new Map<string, { count: number; resetAt: number }>();
const memBans = new Set<string>();
const memLocks = new Map<string, number>();

function memIncr(key: string, windowSec: number): number {
  const now = Date.now();
  const b = memBuckets.get(key) || { count: 0, resetAt: now + windowSec * 1000 };
  if (now > b.resetAt) { b.count = 0; b.resetAt = now + windowSec * 1000; }
  b.count++;
  memBuckets.set(key, b);
  return b.count;
}

async function redisIncr(key: string, windowSec: number): Promise<number> {
  const redis = getRedis();
  if (!redis) return memIncr(key, windowSec);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSec);
  return count;
}

/**
 * Phase 1: Pre-bcrypt check — is this IP or identity allowed to attempt auth?
 * Returns true if allowed, false if rate-limited or banned.
 *
 * MUST be called BEFORE bcrypt.compare to avoid CPU exhaustion.
 */
export async function canAttemptAuth(ip: string, email: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  // 1. Check IP ban first
  const ipBanned = await isIpBanned(ip);
  if (ipBanned) {
    return { allowed: false, reason: "ip_banned", retryAfter: IP_BAN_DURATION_SEC };
  }

  // 2. Check IP rate limit (sliding window)
  const ipKey = `auth:attempt:ip:${ip}`;
  const ipCount = await redisIncr(ipKey, IP_WINDOW_SEC);
  if (ipCount > IP_MAX_PER_WINDOW) {
    logger.warn({ ip, count: ipCount }, "IP rate-limited pre-bcrypt");
    return { allowed: false, reason: "ip_rate_limited", retryAfter: IP_WINDOW_SEC };
  }

  // 3. Check identity rate limit
  const idKey = `auth:attempt:id:${cryptoHash(email)}`;
  const idCount = await redisIncr(idKey, IDENTITY_WINDOW_SEC);
  if (idCount > IDENTITY_MAX_PER_WINDOW) {
    logger.warn({ email, count: idCount }, "identity rate-limited pre-bcrypt");
    return { allowed: false, reason: "identity_rate_limited", retryAfter: IDENTITY_WINDOW_SEC };
  }

  return { allowed: true };
}

/**
 * Phase 2: Post-bcrypt record — log a failed auth attempt.
 * If thresholds are exceeded, ban IP or lock account.
 */
export async function recordAuthFailure(ip: string, email: string, userId?: string): Promise<{
  ipBanned?: boolean;
  accountLocked?: boolean;
  bannedUntil?: Date;
  lockedUntil?: Date;
}> {
  const result: { ipBanned?: boolean; accountLocked?: boolean; bannedUntil?: Date; lockedUntil?: Date } = {};

  // Increment IP failure count
  const ipFailCount = await redisIncr(ipFailKey(ip), IP_FAIL_BAN_WINDOW_SEC);
  if (ipFailCount >= IP_FAIL_BAN_THRESHOLD) {
    await banIp(ip);
    result.ipBanned = true;
    result.bannedUntil = new Date(Date.now() + IP_BAN_DURATION_SEC * 1000);
    logger.error({ ip, failCount: ipFailCount }, "IP BANNED — too many failed auth attempts");
  }

  // Increment identity failure count
  const idFailCount = await redisIncr(idFailKey(email), ACCT_FAIL_LOCK_WINDOW_SEC);
  if (userId && idFailCount >= ACCT_FAIL_LOCK_THRESHOLD) {
    await lockAccount(userId);
    result.accountLocked = true;
    result.lockedUntil = new Date(Date.now() + ACCT_LOCK_DURATION_SEC * 1000);
    logger.error({ userId, email, failCount: idFailCount }, "ACCOUNT LOCKED — too many failed auth attempts");
  }

  return result;
}

/**
 * Clear failures on successful auth (sliding window can reset early).
 */
export async function recordAuthSuccess(ip: string, email: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(ipFailKey(ip));
    await redis.del(idFailKey(email));
    await redis.del(`auth:attempt:ip:${ip}`);
    await redis.del(`auth:attempt:id:${cryptoHash(email)}`);
  } else {
    memBuckets.delete(ipFailKey(ip));
    memBuckets.delete(idFailKey(email));
    memBuckets.delete(`auth:attempt:ip:${ip}`);
    memBuckets.delete(`auth:attempt:id:${cryptoHash(email)}`);
  }
}

async function banIp(ip: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(ipBanKey(ip), "1", "EX", IP_BAN_DURATION_SEC);
  } else {
    memBans.add(ip);
    setTimeout(() => memBans.delete(ip), IP_BAN_DURATION_SEC * 1000);
  }
}

async function isIpBanned(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const v = await redis.get(ipBanKey(ip));
    return v === "1";
  }
  return memBans.has(ip);
}

async function lockAccount(userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(acctLockKey(userId), "1", "EX", ACCT_LOCK_DURATION_SEC);
  } else {
    memLocks.set(userId, Date.now() + ACCT_LOCK_DURATION_SEC * 1000);
    setTimeout(() => memLocks.delete(userId), ACCT_LOCK_DURATION_SEC * 1000);
  }
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const v = await redis.get(acctLockKey(userId));
    return v === "1";
  }
  const lockedUntil = memLocks.get(userId);
  return lockedUntil ? lockedUntil > Date.now() : false;
}

/**
 * Build a 429 Response with appropriate headers.
 */
export function rateLimitResponse(reason: string, retryAfter: number): Response {
  let message: string;
  switch (reason) {
    case "ip_banned":
      message = `IP banned due to too many failed login attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`;
      break;
    case "ip_rate_limited":
      message = "Too many login attempts from this IP. Slow down.";
      break;
    case "identity_rate_limited":
      message = "Too many login attempts for this account. Try again shortly.";
      break;
    default:
      message = "Rate limited.";
  }
  return new Response(
    JSON.stringify({ error: "rate_limited", code: reason, message, retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

/**
 * Get current rate-limit status for debugging/observability.
 */
export async function getAuthRateLimitStatus(ip: string, email?: string, userId?: string): Promise<{
  ipBanned: boolean;
  ipAttempts: number;
  idAttempts: number;
  ipFailures: number;
  idFailures: number;
  accountLocked: boolean;
}> {
  const redis = getRedis();
  const ipAttempts = redis ? parseInt(await redis.get(`auth:attempt:ip:${ip}`) || "0") : memBuckets.get(`auth:attempt:ip:${ip}`)?.count || 0;
  const idAttempts = email ? (redis ? parseInt(await redis.get(`auth:attempt:id:${cryptoHash(email)}`) || "0") : memBuckets.get(`auth:attempt:id:${cryptoHash(email)}`)?.count || 0) : 0;
  const ipFailures = redis ? parseInt(await redis.get(ipFailKey(ip)) || "0") : memBuckets.get(ipFailKey(ip))?.count || 0;
  const idFailures = email ? (redis ? parseInt(await redis.get(idFailKey(email)) || "0") : memBuckets.get(idFailKey(email))?.count || 0) : 0;
  const ipBanned = await isIpBanned(ip);
  const accountLocked = userId ? await isAccountLocked(userId) : false;

  return { ipBanned, ipAttempts, idAttempts, ipFailures, idFailures, accountLocked };
}
