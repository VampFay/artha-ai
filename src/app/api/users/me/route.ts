import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken, verifyPassword, revokeToken } from "@/lib/auth";
import { z } from "zod";
import { unlink, rm } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt });
  } catch { return NextResponse.json({ detail: "Failed to fetch user" }, { status: 500 }); }
}

const DeleteSchema = z.object({ password: z.string().min(1) });

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Password required" }, { status: 400 });
    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ detail: "Password confirmation failed." }, { status: 401 });

    // Revoke the current token
    await revokeToken(token, user.id);

    // Delete uploaded files using storage abstraction
    const docs = await db.document.findMany({ where: { userId: user.id }, select: { filePath: true } });
    const { getFileStore } = await import("@/lib/storage/file-store");
    const fileStore = await getFileStore();
    for (const d of docs) {
      await fileStore.delete(d.filePath);
    }

    // Delete user (cascades to all related rows)
    await db.auditLog.create({ data: { userId: user.id, action: "account_deleted" } });
    await db.user.delete({ where: { id: user.id } });
    return NextResponse.json({ message: "Account deleted." });
  } catch { return NextResponse.json({ detail: "Failed to delete account" }, { status: 500 }); }
}
