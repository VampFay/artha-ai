import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const loans = await db.liability.findMany({ where: { userId: payload.sub }, orderBy: { remaining: "desc" } });

    const totalDebt = loans.reduce((s, l) => s + l.remaining, 0);
    const totalEmi = loans.reduce((s, l) => s + l.emi, 0);

    const income = (await db.income.findMany({ where: { userId: payload.sub } })).reduce((s, i) => s + i.amount, 0);
    const debtToIncomePct = income > 0 ? (totalEmi / income) * 100 : 0;

    // Prepayment insight for largest loan
    const largestLoan = loans[0];
    let prepaymentInsight = "No active loans to simulate prepayment.";
    if (largestLoan) {
      const interestSaved = largestLoan.remaining * (largestLoan.rate / 100) * (largestLoan.tenureLeftMonths / 12) * 0.15;
      prepaymentInsight = `Making one extra EMI payment of ₹${largestLoan.emi.toLocaleString("en-IN")} this year on your ${largestLoan.name} will save you approximately ₹${Math.round(interestSaved).toLocaleString("en-IN")} in interest over the loan tenure.`;
    }

    return NextResponse.json({
      loans: loans.map(l => ({
        id: l.id,
        name: l.name,
        loanType: l.loanType,
        principal: l.principal,
        remaining: l.remaining,
        rate: l.rate,
        emi: l.emi,
        tenureLeftMonths: l.tenureLeftMonths,
        progressPct: l.principal > 0 ? ((l.principal - l.remaining) / l.principal) * 100 : 0,
      })),
      totalDebt,
      totalEmi,
      debtToIncomePct,
      prepaymentInsight,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch liabilities" }, { status: 500 });
  }
}
