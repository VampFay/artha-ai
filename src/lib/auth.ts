import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

// JWT secret: read from env. In dev, a known fallback is used (safe because
// the dev environment is sandboxed). In production, the env var is REQUIRED.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (
    process.env.NODE_ENV === "production"
      ? (() => { throw new Error("JWT_SECRET env var required in production"); })()
      : "dev-only-secret-not-for-production-use-f7a3c9e1b4d8"
  )
);

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
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
