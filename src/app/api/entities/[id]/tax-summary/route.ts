/**
 * POST /api/entities/:id/tax-summary
 * Compute tax liability for an entity for a given financial year.
 * Body: EntityTaxInput (grossIncome, deductions, gst, tdsDeducted, etc.)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { computeEntityTax, compareRegimes, type EntityTaxInput } from "@/lib/entity/tax-engine";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const body = await req.json() as EntityTaxInput & { financialYear?: string };
    const financialYear = body.financialYear || "2024-25";

    const input: EntityTaxInput = {
      entityType: entity.entityType as any,
      financialYear,
      grossIncome: body.grossIncome || 0,
      deductions: body.deductions || {},
      gst: body.gst,
      tdsDeducted: body.tdsDeducted,
      tcsCollected: body.tcsCollected,
      advanceTaxPaid: body.advanceTaxPaid,
      matCreditAvailable: body.matCreditAvailable,
      avgNetProfit3yr: body.avgNetProfit3yr,
      customsDutyPaid: body.customsDutyPaid,
      stampDutyPaid: body.stampDutyPaid,
      sttPaid: body.sttPaid,
      cttPaid: body.cttPaid,
      equalisationLevyReceived: body.equalisationLevyReceived,
      regimeOverride: body.regimeOverride,
    };

    const breakdown = computeEntityTax(input);
    const regimeComparison = compareRegimes(input);

    // Persist tax profile
    const taxProfile = await db.entityTaxProfile.upsert({
      where: {
        entityId_financialYear: { entityId: entity.id, financialYear },
      },
      update: {
        regime: breakdown.regime,
        grossIncome: breakdown.grossIncome,
        totalDeductions: breakdown.totalDeductions,
        taxableIncome: breakdown.taxableIncome,
        incomeTax: breakdown.finalIncomeTax,
        gstPayable: breakdown.gstNetPayable,
        tdsDeducted: breakdown.tdsCredit,
        advanceTaxPaid: breakdown.advanceTaxPaid,
        netTaxPayable: breakdown.netTaxPayable,
        totalTaxBurden: breakdown.totalTaxBurden,
        effectiveTaxRate: breakdown.effectiveTaxRate,
        breakdownJson: JSON.stringify(breakdown),
      },
      create: {
        entityId: entity.id,
        financialYear,
        regime: breakdown.regime,
        grossIncome: breakdown.grossIncome,
        totalDeductions: breakdown.totalDeductions,
        taxableIncome: breakdown.taxableIncome,
        incomeTax: breakdown.finalIncomeTax,
        gstPayable: breakdown.gstNetPayable,
        tdsDeducted: breakdown.tdsCredit,
        advanceTaxPaid: breakdown.advanceTaxPaid,
        netTaxPayable: breakdown.netTaxPayable,
        totalTaxBurden: breakdown.totalTaxBurden,
        effectiveTaxRate: breakdown.effectiveTaxRate,
        breakdownJson: JSON.stringify(breakdown),
      },
    });

    await appendAuditEntry({
      tenantId: entity.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.tax.computed",
      resourceType: "entity",
      resourceId: entity.id,
      details: { financialYear, grossIncome: breakdown.grossIncome, totalTaxBurden: breakdown.totalTaxBurden },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: {
        taxProfileId: taxProfile.id,
        financialYear,
        breakdown,
        regimeComparison: {
          newRegimeTax: regimeComparison.newRegime.finalIncomeTax,
          defaultRegimeTax: regimeComparison.defaultRegime.finalIncomeTax,
          recommendation: regimeComparison.recommendation,
          savings: regimeComparison.savings,
        },
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

/**
 * GET /api/entities/:id/tax-summary?financial_year=2024-25
 * Retrieve previously-computed tax profile.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const url = new URL(req.url);
    const financialYear = url.searchParams.get("financial_year") || "2024-25";

    const taxProfile = await db.entityTaxProfile.findUnique({
      where: {
        entityId_financialYear: { entityId: entity.id, financialYear },
      },
    });

    if (!taxProfile) {
      return Response.json({ data: null, message: "No tax profile computed yet for this FY" });
    }

    const breakdown = taxProfile.breakdownJson ? JSON.parse(taxProfile.breakdownJson) : null;

    return Response.json({
      data: {
        id: taxProfile.id,
        financialYear: taxProfile.financialYear,
        regime: taxProfile.regime,
        grossIncome: taxProfile.grossIncome,
        totalDeductions: taxProfile.totalDeductions,
        taxableIncome: taxProfile.taxableIncome,
        incomeTax: taxProfile.incomeTax,
        gstPayable: taxProfile.gstPayable,
        tdsDeducted: taxProfile.tdsDeducted,
        advanceTaxPaid: taxProfile.advanceTaxPaid,
        netTaxPayable: taxProfile.netTaxPayable,
        totalTaxBurden: taxProfile.totalTaxBurden,
        effectiveTaxRate: taxProfile.effectiveTaxRate,
        breakdown,
        computedAt: taxProfile.computedAt,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
