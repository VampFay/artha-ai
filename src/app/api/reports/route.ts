import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { computeTaxSummary } from "@/lib/tax-engine";
import { computeFinanceSummary } from "@/lib/finance-engine";
import { projectGoal } from "@/lib/goal-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const reportType = url.searchParams.get("type");
    if (!reportType || !["tax_summary", "finance_health", "goal_simulation"].includes(reportType)) {
      return NextResponse.json({ detail: "Invalid report type. Use: tax_summary, finance_health, or goal_simulation" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    // Import pdfkit dynamically (CommonJS module)
    const PDFDocument = (await import("pdfkit")).default;
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(20).fillColor("#10b981").text("FinSight AI", { align: "center" });
    doc.fontSize(10).fillColor("#64748b").text("Financial Intelligence Report", { align: "center" });
    doc.moveDown();

    // User info
    doc.fontSize(12).fillColor("#0f172a").text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.moveDown();

    if (reportType === "tax_summary") {
      const tax = await computeTaxSummary(payload.sub, "2024-25");
      doc.fontSize(16).fillColor("#10b981").text("CA-Ready Tax Summary");
      doc.moveDown();
      doc.fontSize(12).fillColor("#0f172a");
      doc.text(`Financial Year: ${tax.financial_year}`);
      doc.text(`Tax Readiness Score: ${tax.score.score}/100`);
      doc.moveDown();
      doc.fontSize(14).text("Income Summary");
      doc.fontSize(11);
      Object.entries(tax.income_summary).forEach(([k, v]) => doc.text(`  ${k}: Rs ${(v as number).toLocaleString("en-IN")}`));
      doc.moveDown();
      doc.fontSize(14).text("Regime Comparison");
      doc.fontSize(11);
      doc.text(`  Old Regime Tax: Rs ${tax.regime_comparison.old_regime.total_tax.toLocaleString("en-IN")}`);
      doc.text(`  New Regime Tax: Rs ${tax.regime_comparison.new_regime.total_tax.toLocaleString("en-IN")}`);
      doc.text(`  Recommended: ${tax.regime_comparison.recommended_regime} regime`);
      doc.text(`  Savings: Rs ${tax.regime_comparison.savings_amount.toLocaleString("en-IN")}`);
      if (tax.missing_documents.length > 0) {
        doc.moveDown();
        doc.fontSize(14).fillColor("#ef4444").text("Missing Documents");
        doc.fontSize(11);
        tax.missing_documents.forEach((m: any) => doc.text(`  ${m.doc_type}: ${m.reason} (${m.severity})`));
      }
    } else if (reportType === "finance_health") {
      const fin = await computeFinanceSummary(payload.sub, new Date(), 300000);
      doc.fontSize(16).fillColor("#10b981").text("Financial Health Report");
      doc.moveDown();
      doc.fontSize(12).fillColor("#0f172a");
      doc.text(`Health Score: ${fin.score}/100`);
      doc.text(`Monthly Income: Rs ${fin.monthly_income.toLocaleString("en-IN")}`);
      doc.text(`Monthly Expenses: Rs ${fin.monthly_expenses.toLocaleString("en-IN")}`);
      doc.text(`Savings Rate: ${fin.metrics.savings_rate_pct.toFixed(1)}%`);
      doc.text(`Debt-to-Income Ratio: ${fin.metrics.debt_to_income_pct.toFixed(1)}%`);
      doc.text(`Emergency Fund: ${fin.metrics.emergency_fund_months.toFixed(1)} months`);
      doc.text(`Monthly Subscriptions: Rs ${fin.metrics.subscription_total.toLocaleString("en-IN")}`);
      if (fin.top_categories.length > 0) {
        doc.moveDown();
        doc.fontSize(14).text("Top Spending Categories");
        doc.fontSize(11);
        fin.top_categories.forEach((c: any) => doc.text(`  ${c.category}: Rs ${c.amount.toLocaleString("en-IN")} (${c.percentage.toFixed(1)}%)`));
      }
      if (fin.suggestions.length > 0) {
        doc.moveDown();
        doc.fontSize(14).fillColor("#10b981").text("Suggestions");
        doc.fontSize(11).fillColor("#0f172a");
        fin.suggestions.forEach((s: string) => doc.text(`  • ${s}`));
      }
    } else if (reportType === "goal_simulation") {
      const goals = await db.goal.findMany({ where: { userId: payload.sub } });
      doc.fontSize(16).fillColor("#10b981").text("Goal Simulation Report");
      doc.moveDown();
      doc.fontSize(12).fillColor("#0f172a");
      if (goals.length === 0) { doc.text("No goals found."); }
      goals.forEach((g, i) => {
        const proj = projectGoal(g.targetAmount, g.currentAmount, g.monthlyContribution, g.targetDate, g.expectedReturnRate);
        doc.fontSize(13).text(`Goal ${i + 1}: ${g.goalName}`);
        doc.fontSize(11);
        doc.text(`  Target: Rs ${g.targetAmount.toLocaleString("en-IN")}`);
        doc.text(`  Current: Rs ${g.currentAmount.toLocaleString("en-IN")}`);
        doc.text(`  Monthly: Rs ${g.monthlyContribution.toLocaleString("en-IN")}`);
        doc.text(`  Projected Completion: ${proj.projected_completion_date ? new Date(proj.projected_completion_date).toLocaleDateString("en-IN") : "N/A"}`);
        doc.text(`  Shortfall: Rs ${proj.shortfall.toLocaleString("en-IN")}`);
        doc.moveDown();
      });
    }

    // Disclaimer
    doc.moveDown();
    doc.fontSize(8).fillColor("#94a3b8").text("Disclaimer: This report is generated by FinSight AI for informational purposes only. It is not a substitute for professional advice from a Chartered Accountant or investment adviser.", { align: "center" });

    doc.end();

    const pdfBuffer = await pdfPromise;

    await db.auditLog.create({ data: { userId: payload.sub, action: "report_generated", details: JSON.stringify({ report_type: reportType }) } });

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reportType}_report.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ detail: "Failed to generate report" }, { status: 500 });
  }
}
