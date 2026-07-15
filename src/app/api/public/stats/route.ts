/**
 * GET /api/public/stats
 * Returns aggregate platform statistics for the login screen.
 * Public endpoint (no auth required) — only returns anonymized aggregates.
 */

import { db } from "@/lib/db";
import { ENTITY_TYPES } from "@/lib/entity/types";
import { ALL_FILINGS } from "@/lib/entity/compliance-calendar";
import { TAX_RATES } from "@/lib/entity/tax-engine";

export async function GET() {
  try {
    const [
      totalEntities,
      totalUsers,
      totalTaxProfiles,
      totalAuditEntries,
      totalTransactions,
    ] = await Promise.all([
      db.entity.count({ where: { isActive: true } }),
      db.user.count(),
      db.entityTaxProfile.count(),
      db.auditChainEntry.count(),
      db.entityTransaction.count(),
    ]);

    const totalFilingsTracked = ALL_FILINGS.length;

    // Calculate total tax burden across all entities
    const taxProfiles = await db.entityTaxProfile.findMany({
      select: { totalTaxBurden: true, effectiveTaxRate: true },
    });
    const totalTaxBurden = taxProfiles.reduce((sum, t) => sum + t.totalTaxBurden, 0);
    const avgEffectiveRate = taxProfiles.length > 0
      ? taxProfiles.reduce((sum, t) => sum + t.effectiveTaxRate, 0) / taxProfiles.length
      : 0;

    const entityTypesCount = Object.keys(ENTITY_TYPES).length;
    const taxTypesCount = Object.keys(TAX_RATES).length;

    return Response.json({
      data: {
        totalEntities,
        totalUsers,
        entityTypesCount,
        taxTypesCount,
        totalFilingsTracked,
        totalTaxProfiles,
        totalAuditEntries,
        totalTransactions,
        totalTaxBurden,
        avgEffectiveRate,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    return Response.json({
      data: {
        totalEntities: 0,
        totalUsers: 0,
        entityTypesCount: Object.keys(ENTITY_TYPES).length,
        taxTypesCount: Object.keys(TAX_RATES).length,
        totalFilingsTracked: ALL_FILINGS.length,
        totalTaxProfiles: 0,
        totalAuditEntries: 0,
        totalTransactions: 0,
        totalTaxBurden: 0,
        avgEffectiveRate: 0,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
