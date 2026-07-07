import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    // Single query for all holdings (filter client-side for cash vs non-cash)
    const [allHoldings, subscriptions, liabilities, expenses, incomes] = await Promise.all([
      db.assetHolding.findMany({ where: { userId: payload.sub } }),
      db.subscription.findMany({ where: { userId: payload.sub, status: "Active" } }),
      db.liability.findMany({ where: { userId: payload.sub } }),
      db.expense.findMany({ where: { userId: payload.sub } }),
      db.income.findMany({ where: { userId: payload.sub } }),
    ]);

    const liquidAmount = allHoldings.filter(h => h.assetClass === "cash").reduce((s, h) => s + h.value, 0);
    const lockedAmount = allHoldings.filter(h => h.assetClass !== "cash").reduce((s, h) => s + h.value, 0);

    const monthlySubs = subscriptions.reduce((s, sub) => s + (sub.frequency === "Yearly" ? sub.amount / 12 : sub.amount), 0);
    const totalEmi = liabilities.reduce((s, l) => s + l.emi, 0);

    // Current month expenses (use transactionDate, not month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthlyExpenses = expenses
      .filter(e => { const d = new Date(e.transactionDate); return d >= monthStart && d < monthEnd; })
      .reduce((s, e) => s + e.amount, 0);

    const burnRate = monthlyExpenses + monthlySubs + totalEmi;
    const runwayMonths = burnRate > 0 ? liquidAmount / burnRate : 0;

    // Current month income (Income.month is Int 1-12, filter by month + financialYear)
    const currentMonth = now.getMonth() + 1;
    const currentFY = now.getMonth() >= 3 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`;
    const monthlyIncome = incomes
      .filter(i => i.month === currentMonth && i.financialYear === currentFY)
      .reduce((s, i) => s + i.amount, 0);

    const freeCashFlow = monthlyIncome - monthlyExpenses - totalEmi;
    const savingsRate = monthlyIncome > 0 ? (freeCashFlow / monthlyIncome) * 100 : 0;

    return NextResponse.json({
      freeCashFlow,
      savingsRate,
      fixedExpenses: totalEmi + monthlySubs,
      discretionary: Math.max(0, monthlyExpenses - totalEmi - monthlySubs),
      runwayMonths,
      burnRate,
      liquidAmount,
      lockedAmount,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch cashflow" }, { status: 500 });
  }
}
