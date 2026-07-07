import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken, createRefreshToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { z } from "zod";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });

    const { email, password } = parsed.data;

    // Rate limit: 5 login attempts per IP+email per 15 minutes
    if (!checkRateLimit(`login:${ip}:${email}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ detail: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await db.auditLog.create({
        data: {
          userId: user?.id || null,
          action: "login_failed",
          details: JSON.stringify({ email_prefix: email.substring(0, 3) + "***" }),
          ipAddress: ip,
        },
      });
      return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });
    }

    await db.auditLog.create({
      data: { userId: user.id, action: "login", ipAddress: ip },
    });

    const token = await createToken(user.id);
    const userAgent = req.headers.get("user-agent") || undefined;
    const refreshToken = await createRefreshToken(user.id, userAgent, ip);
    return NextResponse.json({ access_token: token, refresh_token: refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt } });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
