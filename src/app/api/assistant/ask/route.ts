import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { computeTaxSummary } from "@/lib/tax-engine";
import { computeFinanceSummary } from "@/lib/finance-engine";
import { z } from "zod";

// Simple in-memory rate limiter: 20 requests per user per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

const QuestionSchema = z.object({
  question: z.string().min(1).max(1000),
});

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  let question = "";

  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    userId = payload.sub;

    // Rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json({ detail: "Rate limit exceeded. Max 20 questions per hour." }, { status: 429 });
    }

    // Validate input
    const body = await req.json();
    const parsed = QuestionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Question required (max 1000 chars)" }, { status: 400 });
    question = parsed.data.question;

    // Build grounded context from user's REAL financial data
    const [taxSummary, financeSummary, goals] = await Promise.all([
      computeTaxSummary(userId, "2024-25").catch(() => null),
      computeFinanceSummary(userId, new Date(), 300000).catch(() => null),
      db.goal.findMany({ where: { userId } }),
    ]);

    const context = [
      `User Financial Data (FY 2024-25):`,
      taxSummary ? `- Tax Readiness Score: ${taxSummary.score.score}/100` : "- Tax data unavailable",
      taxSummary ? `- Gross Income: Rs ${taxSummary.income_summary.gross?.toLocaleString("en-IN") || 0}` : "",
      taxSummary ? `- Recommended Tax Regime: ${taxSummary.regime_comparison.recommended_regime}` : "",
      taxSummary ? `- Tax under Old Regime: Rs ${taxSummary.regime_comparison.old_regime?.total_tax?.toLocaleString("en-IN") || 0}` : "",
      taxSummary ? `- Tax under New Regime: Rs ${taxSummary.regime_comparison.new_regime?.total_tax?.toLocaleString("en-IN") || 0}` : "",
      taxSummary ? `- Missing Documents: ${taxSummary.missing_documents.map((m: any) => m.doc_type).join(", ") || "none"}` : "",
      financeSummary ? `- Financial Health Score: ${financeSummary.score}/100` : "",
      financeSummary ? `- Monthly Income: Rs ${financeSummary.monthly_income?.toLocaleString("en-IN") || 0}` : "",
      financeSummary ? `- Monthly Expenses: Rs ${financeSummary.monthly_expenses?.toLocaleString("en-IN") || 0}` : "",
      financeSummary ? `- Savings Rate: ${financeSummary.metrics?.savings_rate_pct?.toFixed(1) || 0}%` : "",
      financeSummary ? `- Debt-to-Income Ratio: ${financeSummary.metrics?.debt_to_income_pct?.toFixed(1) || 0}%` : "",
      financeSummary ? `- Emergency Fund: ${financeSummary.metrics?.emergency_fund_months?.toFixed(1) || 0} months` : "",
      financeSummary ? `- Top Spending Categories: ${financeSummary.top_categories?.map((c: any) => `${c.category} (Rs ${c.amount?.toLocaleString("en-IN")})`).join(", ") || "none"}` : "",
      goals.length > 0 ? `- Goals: ${goals.map(g => `${g.goalName} (target Rs ${g.targetAmount.toLocaleString("en-IN")}, current Rs ${g.currentAmount.toLocaleString("en-IN")})`).join("; ")}` : "- No goals set",
    ].filter(Boolean).join("\n");

    // Call the REAL LLM via z-ai-web-dev-sdk
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are FinSight AI, a financial assistant. Answer the user's question based ONLY on the financial data provided below. If the answer is not in the data, say "I don't have enough data to answer that." Never invent numbers. Never give investment advice. Be concise (max 3 sentences). Always use Rs for currency.\n\n${context}`
        },
        {
          role: "user",
          content: question
        }
      ],
      thinking: { type: "disabled" }
    });

    const answer = completion.choices[0]?.message?.content || "I couldn't process that request right now.";

    const sources: string[] = [];
    if (taxSummary) sources.push("tax.summary");
    if (financeSummary) sources.push("finance.metrics");
    if (goals.length > 0) sources.push("goals.list");

    await db.auditLog.create({ data: { userId, action: "assistant_asked", details: JSON.stringify({ question_length: question.length, answer_length: answer.length }) } });

    return NextResponse.json({ answer, sources, suggested_followups: [] });
  } catch (e) {
    // Fallback: use rule-based response if LLM fails
    if (userId) {
      try {
        const incomes = await db.income.findMany({ where: { userId, verified: true } });
        const expenses = await db.expense.findMany({ where: { userId } });
        const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
        const totalExpenses = expenses.reduce((s, ex) => s + ex.amount, 0);
        const lower = question.toLowerCase();
        let answer = "I'm having trouble connecting to the AI service right now. ";
        if (lower.includes("tax")) answer += `Your income is Rs ${totalIncome.toLocaleString("en-IN")}.`;
        else if (lower.includes("spend") || lower.includes("expense")) answer += `Total expenses: Rs ${totalExpenses.toLocaleString("en-IN")}.`;
        else answer += `Income: Rs ${totalIncome.toLocaleString("en-IN")}, Expenses: Rs ${totalExpenses.toLocaleString("en-IN")}.`;
        return NextResponse.json({ answer, sources: ["fallback"], suggested_followups: [] });
      } catch {
        return NextResponse.json({ answer: "I'm having trouble right now. Please try again later.", sources: [], suggested_followups: [] });
      }
    }
    return NextResponse.json({ detail: "Failed to process question" }, { status: 500 });
  }
}
