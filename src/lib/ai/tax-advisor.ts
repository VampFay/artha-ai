/**
 * AI Tax Advisor
 * --------------
 * Uses z-ai-web-dev-sdk LLM to provide entity-specific tax advisory.
 *
 * Features:
 *   - Multi-turn conversations with entity context
 *   - Tax regime optimization recommendations
 *   - GST ITC optimization suggestions
 *   - Transfer pricing risk assessment
 *   - Advance tax planning
 *   - CSR spending recommendations
 *   - Proactive alerts for new regulations
 *   - Entity peer comparison
 */

import { db } from "../db";
import { getEntityTypeDef, type EntityType } from "../entity/types";
import { computeEntityTax } from "../entity/tax-engine";

export interface AdvisoryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AdvisoryContext {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  entityTypeDef: any;
  taxRegime: string;
  grossIncome: number;
  totalTaxBurden: number;
  effectiveTaxRate: number;
  gstApplicable: boolean;
  tdsApplicable: boolean;
  csrApplicable: boolean;
  matApplicable: boolean;
  transferPricingRisk: boolean;
  financialYear: string;
  recentFilings: any[];
  recentNotices: any[];
}

export interface AdvisoryResponse {
  content: string;
  recommendations: string[];
  citations: string[];
  followUpQuestions: string[];
  confidenceScore: number;
}

/**
 * Build context for an entity to include in LLM prompts.
 */
export async function buildEntityContext(entityId: string): Promise<AdvisoryContext> {
  const entity = await db.entity.findUnique({
    where: { id: entityId },
    include: {
      taxProfiles: { take: 1, orderBy: { computedAt: "desc" } },
      filings: { take: 5, orderBy: { dueDate: "desc" } },
      notices: { take: 3, orderBy: { issuedDate: "desc" } },
    },
  });

  if (!entity) throw new Error("Entity not found");

  const def = getEntityTypeDef(entity.entityType as EntityType);
  const latestTax = entity.taxProfiles[0];
  const breakdown = latestTax?.breakdownJson ? JSON.parse(latestTax.breakdownJson) : null;

  return {
    entityId: entity.id,
    entityName: entity.name,
    entityType: entity.entityType as EntityType,
    entityTypeDef: def,
    taxRegime: latestTax?.regime || def.taxRegime,
    grossIncome: latestTax?.grossIncome || 0,
    totalTaxBurden: latestTax?.totalTaxBurden || 0,
    effectiveTaxRate: latestTax?.effectiveTaxRate || 0,
    gstApplicable: def.gstApplicable,
    tdsApplicable: def.tdsApplicable,
    csrApplicable: def.csrApplicable,
    matApplicable: def.matApplicable,
    transferPricingRisk: def.transferPricingRisk,
    financialYear: latestTax?.financialYear || "2024-25",
    recentFilings: entity.filings.map(f => ({
      name: f.filingName,
      form: f.form,
      dueDate: f.dueDate,
      status: f.status,
    })),
    recentNotices: entity.notices.map(n => ({
      type: n.noticeType,
      status: n.status,
      issuedDate: n.issuedDate,
    })),
  };
}

/**
 * Build the system prompt with entity context.
 */
function buildSystemPrompt(ctx: AdvisoryContext): string {
  return `You are Artha AI, an expert Indian tax advisor specializing in institutional taxation.

You are advising: ${ctx.entityName}
Entity type: ${ctx.entityTypeDef.label} (${ctx.entityType})
Tax regime: ${ctx.taxRegime}
Gross income (FY ${ctx.financialYear}): ₹${ctx.grossIncome.toLocaleString("en-IN")}
Total tax burden: ₹${ctx.totalTaxBurden.toLocaleString("en-IN")}
Effective tax rate: ${(ctx.effectiveTaxRate * 100).toFixed(2)}%

Tax applicability:
- GST: ${ctx.gstApplicable ? "Yes" : "No"}
- TDS: ${ctx.tdsApplicable ? "Yes" : "No"}
- CSR (Section 135): ${ctx.csrApplicable ? "Yes" : "No"}
- MAT (Section 115JB): ${ctx.matApplicable ? "Yes" : "No"}
- Transfer Pricing: ${ctx.transferPricingRisk ? "Yes — requires Form 3CEB" : "No"}

Recent filings: ${ctx.recentFilings.length > 0 ? ctx.recentFilings.map(f => `${f.name} (${f.status})`).join(", ") : "None"}
Recent notices: ${ctx.recentNotices.length > 0 ? ctx.recentNotices.map(n => `${n.type} (${n.status})`).join(", ") : "None"}

Guidelines:
1. Always cite the relevant section of the Income Tax Act, GST Act, or Companies Act
2. Provide specific numbers where possible (not vague "may reduce tax")
3. If the user asks about something outside Indian tax law, politely decline
4. Recommend actionable steps with timelines
5. Flag any compliance risks you notice
6. Compare with alternative tax regimes if applicable
7. Be concise but thorough — institutional clients need precision

Respond in a structured format with:
- Direct answer to the question
- Key recommendations (bullet points)
- Relevant sections/case laws cited
- Follow-up questions if applicable`;
}

/**
 * Get AI advisory response for an entity.
 */
export async function getEntityTaxAdvice(
  entityId: string,
  userMessage: string,
  conversationHistory: AdvisoryMessage[] = []
): Promise<AdvisoryResponse> {
  const ctx = await buildEntityContext(entityId);

  const systemPrompt = buildSystemPrompt(ctx);

  const messages: AdvisoryMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: userMessage },
  ];

  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: messages.map(m => ({ role: m.role as any, content: m.content })),
      thinking: { type: "disabled" },
    });

    const content = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try rephrasing your question.";

    // Extract recommendations (bullet points starting with → or -)
    const recommendations = content
      .split("\n")
      .filter((line: string) => line.match(/^[→\-\*]\s/) || line.match(/^\d+\.\s/))
      .map((line: string) => line.replace(/^[→\-\*]\s*/, "").replace(/^\d+\.\s*/, ""))
      .slice(0, 5);

    // Extract section citations (e.g., "Section 80C", "§115BAA", "Rule 37")
    const citations = content.match(/(?:Section|Sec\.?|§)\s*\d+[A-Z]*(?:\([0-9A-Za-z]+\))?/gi) || [];

    // Generate follow-up questions
    const followUpQuestions = generateFollowUpQuestions(ctx, userMessage);

    return {
      content,
      recommendations,
      citations: [...new Set(citations)], // dedupe
      followUpQuestions,
      confidenceScore: 0.85,
    };
  } catch (err: any) {
    console.error("AI advisory failed:", err);
    return {
      content: `I encountered an error while analyzing your query. Here's a general recommendation based on your entity profile:\n\nYour ${ctx.entityTypeDef.label} is taxed under ${ctx.taxRegime} at an effective rate of ${(ctx.effectiveTaxRate * 100).toFixed(2)}%. Consider consulting with your CA for specific advice on:\n- Regime optimization (§115BAA vs default)\n- ITC reconciliation if GST-registered\n- Transfer pricing compliance${ctx.transferPricingRisk ? " (you're at risk)" : ""}\n- CSR spending${ctx.csrApplicable ? " (2% of net profit required)" : ""}`,
      recommendations: [
        ctx.matApplicable ? "Review MAT credit utilization — carry forward available for 15 years" : "No MAT applicable",
        ctx.csrApplicable ? "Ensure CSR spending (2% of avg net profit) — file CSR-2 by March 31" : "No CSR requirement",
        ctx.transferPricingRisk ? "File Form 3CEB (TP certificate) by November 30" : "No TP filing required",
      ],
      citations: [],
      followUpQuestions: [],
      confidenceScore: 0.3,
    };
  }
}

/**
 * Generate contextual follow-up questions based on entity profile.
 */
function generateFollowUpQuestions(ctx: AdvisoryContext, userMessage: string): string[] {
  const questions: string[] = [];
  const msg = userMessage.toLowerCase();

  if (msg.includes("regime") || msg.includes("115baa") || msg.includes("115bab")) {
    questions.push("What's my MAT credit position if I switch regimes?");
    questions.push("How does regime change affect my advance tax installments?");
  }

  if (msg.includes("gst") || msg.includes("itc")) {
    questions.push("What's my GSTR-2B vs purchase register mismatch?");
    questions.push("Am I eligible for ITC refund under inverted duty structure?");
  }

  if (msg.includes("transfer pricing") || msg.includes("tp")) {
    questions.push("What are the safe harbour rates for my entity type?");
    questions.push("Do I need to file Country-by-Country report?");
  }

  if (msg.includes("csr")) {
    questions.push("What activities qualify for CSR under Schedule VII?");
    questions.push("Can I carry forward unspent CSR excess?");
  }

  if (msg.includes("advance tax")) {
    questions.push("What are the quarterly installment dates?");
    questions.push("How do I estimate my full-year tax liability?");
  }

  if (questions.length === 0) {
    questions.push(`Should ${ctx.entityName} opt for §115BAA concessional regime?`);
    if (ctx.gstApplicable) questions.push("How can I optimize my GST ITC utilization?");
    if (ctx.transferPricingRisk) questions.push("What's my transfer pricing compliance status?");
    if (ctx.csrApplicable) questions.push("What's my CSR spending target this year?");
  }

  return questions.slice(0, 3);
}

/**
 * Proactive tax planning alerts for an entity.
 */
export async function getProactiveAlerts(entityId: string): Promise<Array<{
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  action: string;
}>> {
  const ctx = await buildEntityContext(entityId);
  const alerts: any[] = [];

  // High effective tax rate
  if (ctx.effectiveTaxRate > 0.30) {
    alerts.push({
      type: "tax_optimization",
      severity: "warning",
      title: "High effective tax rate detected",
      description: `Your effective tax rate is ${(ctx.effectiveTaxRate * 100).toFixed(2)}% — above the standard 30% rate. This may indicate suboptimal tax planning.`,
      action: "Review regime selection and ITC utilization. Consider §115BAA if not already opted.",
    });
  }

  // CSR compliance
  if (ctx.csrApplicable) {
    const now = new Date();
    const marchEnd = new Date(now.getFullYear(), 2, 31);
    if (now > marchEnd) {
      alerts.push({
        type: "csr_deadline",
        severity: "critical",
        title: "CSR-2 filing approaching",
        description: "CSR-2 must be filed by March 31. Ensure 2% of avg net profit is spent on CSR activities.",
        action: "File CSR-2 on MCA portal immediately.",
      });
    }
  }

  // Transfer pricing
  if (ctx.transferPricingRisk) {
    alerts.push({
      type: "tp_compliance",
      severity: "warning",
      title: "Transfer pricing documentation required",
      description: "Entities with international transactions must file Form 3CEB by November 30.",
      action: "Engage CA for TP audit and Form 3CEB filing.",
    });
  }

  // Overdue filings
  const overdueFilings = ctx.recentFilings.filter(f => f.status === "overdue");
  if (overdueFilings.length > 0) {
    alerts.push({
      type: "overdue_filing",
      severity: "critical",
      title: `${overdueFilings.length} overdue filing(s)`,
      description: overdueFilings.map(f => f.name).join(", "),
      action: "File immediately to avoid additional penalty.",
    });
  }

  // Pending notices
  const pendingNotices = ctx.recentNotices.filter(n => n.status === "received");
  if (pendingNotices.length > 0) {
    alerts.push({
      type: "pending_notice",
      severity: "critical",
      title: `${pendingNotices.length} pending tax notice(s)`,
      description: pendingNotices.map(n => n.type).join(", "),
      action: "Respond to notices within the deadline. Engage legal counsel if needed.",
    });
  }

  // MAT credit
  if (ctx.matApplicable && ctx.effectiveTaxRate > 0.20) {
    alerts.push({
      type: "mat_credit",
      severity: "info",
      title: "MAT credit utilization opportunity",
      description: "If MAT was paid in previous years, you may have MAT credit available to offset current tax liability.",
      action: "Review MAT credit carry-forward balance (Form 29B).",
    });
  }

  return alerts;
}

/**
 * Compare entity's tax metrics with peers (anonymized).
 */
export async function getPeerComparison(entityId: string): Promise<{
  yourRate: number;
  peerAverage: number;
  peerMedian: number;
  percentile: number;
  benchmarkRate: number;
}> {
  const ctx = await buildEntityContext(entityId);

  // Fetch peer entities (same entity type)
  const peers = await db.entityTaxProfile.findMany({
    where: {
      entity: { entityType: ctx.entityType },
      entityId: { not: entityId },
    },
    select: { effectiveTaxRate: true },
    take: 50,
  });

  const peerRates = peers.map(p => p.effectiveTaxRate).sort((a, b) => a - b);
  const peerAverage = peerRates.length > 0 ? peerRates.reduce((s, r) => s + r, 0) / peerRates.length : 0;
  const peerMedian = peerRates.length > 0 ? peerRates[Math.floor(peerRates.length / 2)] : 0;

  // Calculate percentile
  const belowYou = peerRates.filter(r => r < ctx.effectiveTaxRate).length;
  const percentile = peerRates.length > 0 ? (belowYou / peerRates.length) * 100 : 50;

  // Benchmark: §115BAA effective rate
  const benchmarkRate = 0.2517;

  return {
    yourRate: ctx.effectiveTaxRate,
    peerAverage,
    peerMedian,
    percentile,
    benchmarkRate,
  };
}
