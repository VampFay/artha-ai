import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const monthsParam = parseInt(new URL(req.url).searchParams.get("months") || "6", 10);
    const months = Math.min(24, Math.max(1, isNaN(monthsParam) ? 6 : monthsParam));

    const [expenses, incomes] = await Promise.all([
      db.expense.findMany({ where: { userId: payload.sub } }),
      db.income.findMany({ where: { userId: payload.sub } }),
    ]);

    const now = new Date();
    const data: { month: string; income: number; expense: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthNum = d.getMonth() + 1;

      // Income: filter by month Int + financialYear
      const fy = d.getMonth() >= 3 ? `${d.getFullYear()}-${String(d.getFullYear() + 1).slice(2)}` : `${d.getFullYear() - 1}-${String(d.getFullYear()).slice(2)}`;
      const monthIncome = incomes
        .filter(inc => inc.month === monthNum && inc.financialYear === fy)
        .reduce((s, inc) => s + inc.amount, 0);

      // Expense: filter by transactionDate
      const monthExpense = expenses
        .filter(e => { const ed = new Date(e.transactionDate); return ed >= monthStart && ed < monthEnd; })
        .reduce((s, e) => s + e.amount, 0);

      data.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        income: monthIncome,
        expense: monthExpense,
      });
    }

    return NextResponse.json({ items: data });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch income vs expenses" }, { status: 500 });
  }
}
