import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const [consents, documents, incomes, expenses, deductions, goals, logs] = await Promise.all([
      db.userConsent.findMany({ where: { userId: payload.sub } }),
      db.document.findMany({ where: { userId: payload.sub } }),
      db.income.findMany({ where: { userId: payload.sub } }),
      db.expense.findMany({ where: { userId: payload.sub } }),
      db.deduction.findMany({ where: { userId: payload.sub } }),
      db.goal.findMany({ where: { userId: payload.sub } }),
      db.auditLog.findMany({ where: { userId: payload.sub }, orderBy: { timestamp: "desc" } }),
    ]);
    const data = {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt },
      consents: consents.map((c) => ({ consent_type: c.consentType, accepted_at: c.acceptedAt, revoked_at: c.revokedAt })),
      documents: documents.map((d) => ({ id: d.id, document_type: d.documentType, file_name: d.fileName, processing_status: d.processingStatus, created_at: d.createdAt })),
      incomes: incomes.map((i) => ({ income_type: i.incomeType, source: i.source, amount: i.amount, financial_year: i.financialYear, verified: i.verified })),
      expenses: expenses.map((e) => ({ transaction_date: e.transactionDate, description: e.description, category: e.category, amount: e.amount })),
      deductions: deductions.map((d) => ({ deduction_type: d.deductionType, amount: d.amount, financial_year: d.financialYear, verified: d.verified })),
      goals: goals.map((g) => ({ goal_name: g.goalName, target_amount: g.targetAmount, current_amount: g.currentAmount, monthly_contribution: g.monthlyContribution, target_date: g.targetDate })),
      audit_logs: logs.map((l) => ({ action: l.action, timestamp: l.timestamp, details: l.details ? safeParse(l.details) : null })),
    };
    return NextResponse.json(data, { headers: { "Content-Disposition": `attachment; filename="finsight_export_${user.id}.json"` } });
  } catch { return NextResponse.json({ detail: "Failed to export data" }, { status: 500 }); }
}

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return s; } }
