import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

function safeParse(s: string | null): any { if (!s) return null; try { return JSON.parse(s); } catch { return s; } }

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get("size") || "50")));
    const offset = (page - 1) * size;
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({ where: { userId: payload.sub }, orderBy: { timestamp: "desc" }, skip: offset, take: size }),
      db.auditLog.count({ where: { userId: payload.sub } }),
    ]);
    return NextResponse.json({ items: logs.map((l) => ({ id: l.id, action: l.action, details: safeParse(l.details), ip_address: l.ipAddress, timestamp: l.timestamp })), total, page, size });
  } catch { return NextResponse.json({ detail: "Failed to fetch audit log" }, { status: 500 }); }
}
