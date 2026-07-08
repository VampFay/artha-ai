import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getJobStatus } from "@/lib/job-queue";

/**
 * GET /api/reports/jobs/[id] — poll report generation job status.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const status = getJobStatus(id);

    return NextResponse.json({
      job_id: id,
      status: status.status,
      result: status.result,
      error: status.error,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch job status" }, { status: 500 });
  }
}
