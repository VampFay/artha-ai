import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const [holdings, subscriptions, liabilities, expenses] = await Promise.all([
      db.assetHolding.findMany({ where: { userId: payload.sub, assetClass: "cash" } }),
      db.subscription.findMany({ where: { userId: payload.sub, status: "Active" } }),
      db.liability.findMany({ where: { userId: payload.sub } }),
      db.expense.findMany({ where: { userId: payload.sub } }),
    ]);

    const liquidAmount = holdings.reduce((s, h) => s + h.value, 0);
    const lockedAmount = (await db.assetHolding.findMany({ where: { userId: payload.sub, NOT: { assetClass: "cash" } } })).reduce((s, h) => s + h.value, 0);

    const monthlySubs = subscriptions.reduce((s, sub) => s + (sub.frequency === "Yearly" ? sub.amount / 12 : sub.amount), 0);
    const totalEmi = liabilities.reduce((s, l) => s + l.emi, 0);

    // Estimate monthly expenses from expense records
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyExpenses = expenses
      .filter(e => new Date(e.month) >= monthStart)
      .reduce((s, e) => s + e.amount, 0);

    const burnRate = monthlyExpenses + monthlySubs + totalEmi;
    const runwayMonths = burnRate > 0 ? liquidAmount / burnRate : 0;

    const income = (await db.income.findMany({ where: { userId: payload.sub } })).reduce((s, i) => s + i.amount, 0);
    const freeCashFlow = income - monthlyExpenses - totalEmi;
    const savingsRate = income > 0 ? (freeCashFlow / income) * 100 : 0;

    return NextResponse.json({
      freeCashFlow,
      savingsRate,
      fixedExpenses: totalEmi + monthlySubs,
      discretionary: monthlyExpenses - totalEmi - monthlySubs > 0 ? monthlyExpenses - totalEmi - monthlySubs : 0,
      runwayMonths,
      burnRate,
      liquidAmount,
      lockedAmount,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch cashflow" }, { status: 500 });
  }
}
