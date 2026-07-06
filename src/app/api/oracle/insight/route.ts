import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const [taxData, financeData, subs, liabilities] = await Promise.all([
      db.taxEstimation.findFirst({ where: { userId: payload.sub }, orderBy: { computedAt: "desc" } }),
      db.financialHealthScore.findFirst({ where: { userId: payload.sub }, orderBy: { month: "desc" } }),
      db.subscription.findMany({ where: { userId: payload.sub, status: "Active" } }),
      db.liability.findMany({ where: { userId: payload.sub } }),
    ]);

    const insights: string[] = [];

    if (financeData && financeData.savingsRate < 20) {
      insights.push(`Your savings rate is ${financeData.savingsRate.toFixed(0)}%. Consider increasing your savings to at least 20% for better financial health.`);
    }

    const monthlySubs = subs.reduce((s, sub) => s + (sub.frequency === "Yearly" ? sub.amount / 12 : sub.amount), 0);
    if (monthlySubs > 5000) {
      insights.push(`You have ₹${Math.round(monthlySubs).toLocaleString("en-IN")} in monthly subscriptions. Reviewing and canceling unused ones could boost your savings.`);
    }

    const totalEmi = liabilities.reduce((s, l) => s + l.emi, 0);
    if (liabilities.length > 0 && totalEmi > 50000) {
      insights.push(`Your total monthly EMI burden is ₹${Math.round(totalEmi).toLocaleString("en-IN")}. Consider prepaying high-interest loans to reduce burden.`);
    }

    if (taxData && Number(taxData.estimatedTaxOldRegime) > 100000) {
      insights.push(`Your estimated tax liability is ₹${Math.round(Number(taxData.estimatedTaxOldRegime)).toLocaleString("en-IN")}. Explore 80C deductions (PPF, ELSS) to save up to ₹46,800.`);
    }

    // Default insight if nothing specific
    if (insights.length === 0) {
      insights.push("Your financial profile looks healthy. Keep up the good work and consider diversifying your investments.");
    }

    return NextResponse.json({
      text: insights[0],
      allInsights: insights,
    });
  } catch (e: any) {
    console.error("Oracle insight error:", e?.message || e);
    return NextResponse.json({ detail: "Failed to fetch insight", error: e?.message }, { status: 500 });
  }
}
