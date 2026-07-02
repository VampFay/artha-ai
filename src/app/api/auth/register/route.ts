import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128).regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: "Password must be 8+ chars with 1 letter + 1 digit." },
        { status: 422 }
      );
    }
    const { name, email, password } = parsed.data;
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ detail: "Email already registered." }, { status: 409 });
    }
    const user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
    await db.auditLog.create({
      data: { userId: user.id, action: "register", details: JSON.stringify({ email }) },
    });
    const token = await createToken(user.id);
    return NextResponse.json(
      { access_token: token, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
