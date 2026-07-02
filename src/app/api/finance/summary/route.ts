import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { computeFinanceSummary } from "@/lib/finance-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");
    const efRaw = url.searchParams.get("emergency_fund") || "0";
    const ef = parseFloat(efRaw);
    if (isNaN(ef) || ef < 0) return NextResponse.json({ detail: "Invalid emergency_fund value" }, { status: 400 });
    let month = new Date();
    if (monthParam) {
      month = new Date(monthParam);
      if (isNaN(month.getTime())) return NextResponse.json({ detail: "Invalid month format" }, { status: 400 });
    }
    const summary = await computeFinanceSummary(payload.sub, month, ef);
    return NextResponse.json(summary);
  } catch { return NextResponse.json({ detail: "Failed to compute finance summary" }, { status: 500 }); }
}
