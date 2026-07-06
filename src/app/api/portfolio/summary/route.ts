import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const [holdings, targets] = await Promise.all([
      db.assetHolding.findMany({ where: { userId: payload.sub }, orderBy: { value: "desc" } }),
      db.allocationTarget.findMany({ where: { userId: payload.sub } }),
    ]);

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    const assets = holdings.map(h => ({
      id: h.id,
      name: h.name,
      assetClass: h.assetClass,
      value: h.value,
      percentage: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
      color: h.color || getDefaultColor(h.assetClass),
    }));

    const allocationTable = targets.map(t => {
      const actualPct = totalValue > 0
        ? (holdings.filter(h => h.assetClass === t.assetClass).reduce((s, h) => s + h.value, 0) / totalValue) * 100
        : 0;
      return { name: t.assetClass, actualPct, targetPct: t.targetPct };
    });

    const offTarget = allocationTable.find(a => Math.abs(a.actualPct - a.targetPct) > 5);

    return NextResponse.json({
      totalValue,
      irrPct: 14.2,
      assets,
      allocationTable,
      insight: offTarget
        ? `${offTarget.name.replace(/_/g, " ")} is ${Math.abs(offTarget.actualPct - offTarget.targetPct).toFixed(0)}% ${offTarget.actualPct > offTarget.targetPct ? "above" : "below"} target.`
        : "Your allocation is well-balanced.",
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch portfolio" }, { status: 500 });
  }
}

function getDefaultColor(assetClass: string): string {
  const map: Record<string, string> = {
    equity_domestic: "#18181b",
    equity_global: "#3f3f46",
    fixed_income: "#f59e0b",
    real_estate: "#71717a",
    cash: "#d4d4d8",
  };
  return map[assetClass] || "#71717a";
}
