import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const expenses = await db.expense.findMany({ where: { userId: payload.sub } });
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonth = expenses.filter(e => new Date(e.month || e.createdAt) >= monthStart);
    const lastMonth = expenses.filter(e => { const d = new Date(e.month || e.createdAt); return d >= lastMonthStart && d < monthStart; });

    // Group by category
    const byCategory: Record<string, { current: number; previous: number }> = {};
    for (const e of thisMonth) {
      const cat = e.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = { current: 0, previous: 0 };
      byCategory[cat].current += e.amount;
    }
    for (const e of lastMonth) {
      const cat = e.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = { current: 0, previous: 0 };
      byCategory[cat].previous += e.amount;
    }

    const items = Object.entries(byCategory)
      .map(([category, vals]) => {
        const trend = vals.previous > 0 ? ((vals.current - vals.previous) / vals.previous) * 100 : 0;
        return { category, amount: vals.current, trend };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch top expenses" }, { status: 500 });
  }
}
