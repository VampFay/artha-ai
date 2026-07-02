import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const goal = await db.goal.findUnique({ where: { id } });
    if (!goal) return NextResponse.json({ detail: "Goal not found" }, { status: 404 });
    if (goal.userId !== payload.sub) return NextResponse.json({ detail: "Not your goal" }, { status: 403 });
    await db.goal.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ detail: "Failed to delete goal" }, { status: 500 }); }
}
