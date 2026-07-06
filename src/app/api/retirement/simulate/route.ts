import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { currentAge, targetAge, monthlyExpense, currentCorpus } = body;

    const inflationRate = 0.06;
    const returnRate = 0.12;
    const withdrawalRate = 0.04;

    const yearsToRetirement = Number(targetAge) - Number(currentAge);
    const futureMonthlyExpense = Number(monthlyExpense) * Math.pow(1 + inflationRate, yearsToRetirement);
    const targetCorpus = (futureMonthlyExpense * 12) / withdrawalRate;
    const requiredSIP = computeRequiredSIP(Number(currentCorpus), targetCorpus, returnRate, yearsToRetirement);

    // Trajectory points
    const trajectory: { age: number; corpus: number }[] = [];
    let corpus = Number(currentCorpus);
    const annualContribution = requiredSIP * 12;
    for (let age = Number(currentAge); age <= Number(targetAge); age++) {
      trajectory.push({ age, corpus: Math.round(corpus) });
      corpus = (corpus + annualContribution) * (1 + returnRate);
    }

    return NextResponse.json({
      futureMonthlyExpense: Math.round(futureMonthlyExpense),
      targetCorpus: Math.round(targetCorpus),
      requiredSIP: Math.round(requiredSIP),
      trajectory,
      assumptions: { inflationRate, returnRate, withdrawalRate },
    });
  } catch {
    return NextResponse.json({ detail: "Failed to simulate retirement" }, { status: 500 });
  }
}

function computeRequiredSIP(currentCorpus: number, targetCorpus: number, annualReturn: number, years: number): number {
  // Future value of current corpus
  const futureCorpus = currentCorpus * Math.pow(1 + annualReturn, years);
  // Remaining amount needed
  const remaining = Math.max(0, targetCorpus - futureCorpus);
  // Monthly SIP via future value of annuity formula
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  if (monthlyRate === 0) return remaining / months;
  const sipFVFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return remaining / sipFVFactor;
}
