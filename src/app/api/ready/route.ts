import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/ready — readiness probe (checks DB connection).
 * Returns 200 if DB is reachable, 503 if not.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ready",
      checks: { database: "ok" },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "not_ready",
      checks: { database: "error" },
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
