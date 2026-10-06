import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken, createRefreshToken } from "@/lib/auth";
import { getClientIp, validateOrigin } from "@/lib/security";
import { canAttemptAuth, recordAuthFailure, recordAuthSuccess, isAccountLocked, rateLimitResponse } from "@/lib/security/auth-rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });

    const { email, password } = parsed.data;

    // WP2.3: Pre-bcrypt rate limit — checked BEFORE bcrypt.compare (~250ms CPU)
    const authCheck = await canAttemptAuth(ip, email);
    if (!authCheck.allowed) {
      logger.warn({ ip, email, reason: authCheck.reason }, "auth attempt blocked pre-bcrypt");
      return rateLimitResponse(authCheck.reason!, authCheck.retryAfter!);
    }

    const user = await db.user.findUnique({ where: { email } });

    // WP2.3: Account lock check (post-lookup, pre-bcrypt)
    if (user && await isAccountLocked(user.id)) {
      logger.warn({ userId: user.id, ip }, "login attempt on locked account");
      return NextResponse.json(
        { detail: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." },
        { status: 423 }, // 423 Locked
      );
    }

    // Timing-safe: do bcrypt even if user not found, to avoid user-enumeration timing attack
    const passwordHash = user?.passwordHash || "$2b$12$invalid.hash.toPrevent.timing.leak.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    const passwordValid = await verifyPassword(password, passwordHash);

    if (!user || !passwordValid) {
      // WP2.3: Record failure + ban IP / lock account if thresholds exceeded
      const banResult = await recordAuthFailure(ip, email, user?.id);

      await db.auditLog.create({
        data: {
          userId: user?.id || null,
          action: "login_failed",
          details: JSON.stringify({
            email_prefix: email.substring(0, 3) + "***",
            ipBanned: banResult.ipBanned || false,
            accountLocked: banResult.accountLocked || false,
          }),
          ipAddress: ip,
        },
      });

      if (banResult.ipBanned) {
        return NextResponse.json(
          { detail: "Too many failed attempts from this IP. IP banned for 1 hour." },
          { status: 429 },
        );
      }
      if (banResult.accountLocked) {
        return NextResponse.json(
          { detail: "Account locked due to too many failed attempts. Try again in 15 minutes." },
          { status: 423 },
        );
      }

      return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });
    }

    // WP2.3: Clear failure counters on success
    await recordAuthSuccess(ip, email, user.id);

    await db.auditLog.create({
      data: { userId: user.id, action: "login", ipAddress: ip },
    });

    const token = await createToken(user.id);
    const userAgent = req.headers.get("user-agent") || undefined;
    const refreshToken = await createRefreshToken(user.id, userAgent, ip);
    return NextResponse.json({
      access_token: token,
      refresh_token: refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt },
    });
  } catch (e) {
    logger.error({ err: e }, "Login error");
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
