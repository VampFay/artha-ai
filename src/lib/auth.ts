import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { db } from "./db";

// JWT secret: read from env. In dev, a known fallback is used (safe because
// the dev environment is sandboxed). In production, the env var is REQUIRED.
// Lazy initialization to allow build without JWT_SECRET set.
let _jwtSecret: Uint8Array | null = null;
function getJwtSecret(): Uint8Array {
  if (_jwtSecret) return _jwtSecret;
  const secret = process.env.JWT_SECRET || (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("JWT_SECRET env var required in production"); })()
      : "dev-only-secret-not-for-production-use-f7a3c9e1b4d8"
  );
  _jwtSecret = new TextEncoder().encode(secret);
  return _jwtSecret;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h") // Access token (upgrade to 15m when frontend supports auto-refresh)
    .sign(getJwtSecret());
}

/**
 * Create a refresh token (30-day) and store its hash in the DB.
 * Returns the raw token string (only seen once by the client).
 */
export async function createRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const rawToken = `${userId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await db.refreshToken.create({
    data: { userId, tokenHash, expiresAt, userAgent, ipAddress },
  });

  return rawToken;
}

/**
 * Verify a refresh token, rotate it (revoke old, issue new), return new pair.
 * Returns null if token is invalid, expired, or already revoked.
 */
export async function rotateRefreshToken(
  rawToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const stored = await db.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!stored) return null;
  if (stored.revokedAt) return null;
  if (stored.expiresAt < new Date()) return null;

  // Revoke old token (rotation — prevents replay attacks)
  await db.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Issue new pair
  const accessToken = await createToken(stored.userId);
  const newRefreshToken = await createRefreshToken(stored.userId, userAgent, ipAddress);

  return { accessToken, refreshToken: newRefreshToken, userId: stored.userId };
}

/**
 * Revoke all refresh tokens for a user (logout all devices).
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Get active sessions for a user (non-revoked, non-expired refresh tokens).
 */
export async function getActiveSessions(userId: string) {
  return db.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    // Check if token has been revoked
    const revoked = await db.revokedToken.findUnique({ where: { token } });
    if (revoked) return null;
    // Check if user still exists
    const user = await db.user.findUnique({ where: { id: payload.sub }, select: { id: true } });
    if (!user) return null;
    return payload as { sub: string };
  } catch {
    return null;
  }
}

export async function revokeToken(token: string, userId?: string): Promise<void> {
  try {
    await db.revokedToken.create({ data: { token, userId } });
  } catch {
    // Token may already be revoked — ignore
  }
}

// Cleanup expired revoked tokens (call periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    await db.revokedToken.deleteMany({ where: { revokedAt: { lt: oneDayAgo } } });
  } catch {}
}

export const CONSENT_TEXT =
  "FinSight AI needs your permission to process uploaded financial documents for tax-readiness and financial-health analysis. You can delete your documents at any time.";
