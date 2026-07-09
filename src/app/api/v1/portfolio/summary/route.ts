/**
 * GET /api/v1/portfolio/summary
 * Returns portfolio summary for the authenticated user.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { getTenantCurrency, formatCurrency } from "@/lib/enterprise/multi-currency";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "portfolio", "read");

    const [holdings, targets] = await Promise.all([
      db.assetHolding.findMany({ where: { userId: ctx.userId } }),
      db.allocationTarget.findMany({ where: { userId: ctx.userId } }),
    ]);

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    const currency = ctx.tenantId ? await getTenantCurrency(ctx.tenantId) : "INR";

    const byClass: Record<string, number> = {};
    for (const h of holdings) {
      byClass[h.assetClass] = (byClass[h.assetClass] || 0) + h.value;
    }

    const targetMap: Record<string, number> = {};
    for (const t of targets) {
      targetMap[t.assetClass] = t.targetPct;
    }

    const allocation = Object.keys(byClass).map((cls) => ({
      asset_class: cls,
      value: byClass[cls],
      percentage: totalValue > 0 ? (byClass[cls] / totalValue) * 100 : 0,
      target_pct: targetMap[cls] || 0,
      drift: totalValue > 0 ? (byClass[cls] / totalValue) * 100 - (targetMap[cls] || 0) : 0,
    }));

    return Response.json({
      data: {
        total_value: totalValue,
        total_value_display: formatCurrency(totalValue, currency),
        currency,
        holdings_count: holdings.length,
        allocation,
        holdings: holdings.map((h) => ({
          id: h.id,
          name: h.name,
          asset_class: h.assetClass,
          value: h.value,
          value_display: formatCurrency(h.value, currency),
        })),
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
