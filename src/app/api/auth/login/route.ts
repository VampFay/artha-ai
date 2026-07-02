import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { z } from "zod";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });
    const { email, password } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      await db.auditLog.create({ data: { userId: user?.id || null, action: "login_failed", details: JSON.stringify({ email }) } });
      return NextResponse.json({ detail: "Invalid credentials." }, { status: 401 });
    }
    await db.auditLog.create({ data: { userId: user.id, action: "login" } });
    const token = await createToken(user.id);
    return NextResponse.json({ access_token: token, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt } });
  } catch {
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
