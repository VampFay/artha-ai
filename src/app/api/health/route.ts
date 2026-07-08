import { NextResponse } from "next/server";

/**
 * GET /api/health — liveness probe (always returns 200).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "artha-ai",
    version: process.env.npm_package_version || "0.2.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
