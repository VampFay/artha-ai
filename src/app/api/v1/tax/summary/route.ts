/**
 * GET /api/v1/tax/summary
 * Returns tax summary for the authenticated user.
 * Supports per-tenant custom tax rules.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { getEffectiveTaxRules } from "@/lib/enterprise/custom-tax-rules";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "tax", "read");

    const url = new URL(req.url);
    const financialYear = url.searchParams.get("financial_year") || "2024-25";

    // Get income, deductions for user
    const [incomes, deductions] = await Promise.all([
      db.income.findMany({ where: { userId: ctx.userId } }),
      db.deduction.findMany({ where: { userId: ctx.userId, financialYear } }),
    ]);

    // Load tenant-specific tax rules
    const taxRules = await getEffectiveTaxRules(ctx.tenantId, financialYear);

    // Compute tax with custom rules
    const grossIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

    const oldRegimeTax = computeTaxWithRules(grossIncome - totalDeductions, taxRules.old_regime_slabs, taxRules);
    const newRegimeTax = computeTaxWithRules(grossIncome, taxRules.new_regime_slabs, taxRules);

    const recommendedRegime = oldRegimeTax < newRegimeTax ? "old" : "new";

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "tax.summary.viewed",
      details: { financialYear, grossIncome, recommendedRegime },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: {
        financial_year: financialYear,
        gross_income: grossIncome,
        total_deductions: totalDeductions,
        regime_comparison: {
          old_regime: { tax: oldRegimeTax },
          new_regime: { tax: newRegimeTax },
          recommended_regime: recommendedRegime,
          savings_amount: Math.abs(oldRegimeTax - newRegimeTax),
        },
        applied_overrides: ctx.tenantId ? Object.keys(taxRules).filter(k => k !== "old_regime_slabs" && k !== "new_regime_slabs") : [],
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

function computeTaxWithRules(taxableIncome: number, slabs: any[], rules: any): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  let previousSlab = 0;
  for (const slab of slabs) {
    if (taxableIncome > previousSlab) {
      const slabAmount = Math.min(taxableIncome, slab.upTo) - previousSlab;
      tax += slabAmount * slab.rate;
      previousSlab = slab.upTo;
    } else {
      break;
    }
  }

  // Apply rebate u/s 87A
  const rebateLimit = rules.rebate_87a_old_regime_income_limit;
  const rebateAmount = rules.rebate_87a_old_regime_amount;
  if (taxableIncome <= rebateLimit) {
    tax = Math.max(0, tax - rebateAmount);
  }

  // Apply cess
  tax += tax * (rules.cess_rate || 0.04);

  return Math.round(tax);
}
