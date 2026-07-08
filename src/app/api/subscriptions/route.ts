import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const subscriptionSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().positive().max(1_000_000),
  frequency: z.enum(["Monthly", "Yearly", "Quarterly", "Weekly"]).default("Monthly"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const subs = await db.subscription.findMany({ where: { userId: payload.sub }, orderBy: { createdAt: "desc" } });

    const monthlyTotal = subs
      .filter(s => s.status === "Active")
      .reduce((sum, s) => sum + (s.frequency === "Yearly" ? s.amount / 12 : s.frequency === "Quarterly" ? s.amount / 3 : s.frequency === "Weekly" ? s.amount * 52 / 12 : s.amount), 0);

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
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ detail: "Invalid input", errors: parsed.error.issues }, { status: 400 });
    }
    const { name, amount, frequency } = parsed.data;

    const sub = await db.subscription.create({
      data: {
        userId: payload.sub,
        name,
        amount,
        frequency,
        status: "Active",
      },
    });

    await db.auditLog.create({ data: { userId: payload.sub, action: "subscription_added", details: JSON.stringify({ sub_id: sub.id, name }) } });

    return NextResponse.json({ id: sub.id }, { status: 201 });
  } catch {
    return NextResponse.json({ detail: "Failed to add subscription" }, { status: 500 });
  }
}
