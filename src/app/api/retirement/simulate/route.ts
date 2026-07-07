import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const retirementSchema = z.object({
  currentAge: z.number().int().min(18).max(100),
  targetAge: z.number().int().min(20).max(110),
  monthlyExpense: z.number().positive().max(10_000_000),
  currentCorpus: z.number().min(0).max(1_000_000_000),
}).refine(d => d.targetAge > d.currentAge, { message: "Target age must be greater than current age" });

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = retirementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ detail: "Invalid input", errors: parsed.error.issues }, { status: 400 });
    }
    const { currentAge, targetAge, monthlyExpense, currentCorpus } = parsed.data;

    const inflationRate = 0.06;
    const returnRate = 0.12;
    const withdrawalRate = 0.04;

    const yearsToRetirement = targetAge - currentAge;
    const futureMonthlyExpense = monthlyExpense * Math.pow(1 + inflationRate, yearsToRetirement);
    const targetCorpus = (futureMonthlyExpense * 12) / withdrawalRate;
    const requiredSIP = computeRequiredSIP(currentCorpus, targetCorpus, returnRate, yearsToRetirement);

    // Trajectory points
    const trajectory: { age: number; corpus: number }[] = [];
    let corpus = currentCorpus;
    const annualContribution = requiredSIP * 12;
    for (let age = currentAge; age <= targetAge; age++) {
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
  const futureCorpus = currentCorpus * Math.pow(1 + annualReturn, years);
  const remaining = Math.max(0, targetCorpus - futureCorpus);
  const monthlyRate = annualReturn / 12;
  const months = years * 12;
  if (monthlyRate === 0) return remaining / months;
  const sipFVFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  return remaining / sipFVFactor;
}
