import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { computeTaxSummary } from "@/lib/tax-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const fy = url.searchParams.get("financial_year") || "2024-25";
    const summary = await computeTaxSummary(payload.sub, fy);
    return NextResponse.json(summary);
  } catch { return NextResponse.json({ detail: "Failed to compute tax summary" }, { status: 500 }); }
}
