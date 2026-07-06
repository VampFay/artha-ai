import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const subs = await db.subscription.findMany({ where: { userId: payload.sub }, orderBy: { createdAt: "desc" } });

    const monthlyTotal = subs
      .filter(s => s.status === "Active")
      .reduce((sum, s) => sum + (s.frequency === "Yearly" ? s.amount / 12 : s.amount), 0);

    return NextResponse.json({
      items: subs.map(s => ({
        id: s.id,
        name: s.name,
        amount: s.amount,
        frequency: s.frequency,
        status: s.status,
      })),
      monthlyTotal,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, amount, frequency } = body;

    const sub = await db.subscription.create({
      data: {
        userId: payload.sub,
        name,
        amount: Number(amount),
        frequency: frequency || "Monthly",
        status: "Active",
      },
    });

    await db.auditLog.create({ data: { userId: payload.sub, action: "subscription_added", details: JSON.stringify({ sub_id: sub.id, name }) } });

    return NextResponse.json({ id: sub.id }, { status: 201 });
  } catch {
    return NextResponse.json({ detail: "Failed to add subscription" }, { status: 500 });
  }
}
