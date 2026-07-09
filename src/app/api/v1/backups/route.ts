/**
 * Backup records
 * GET /api/v1/backups
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");

    const where = ctx.tenantId ? { tenantId: ctx.tenantId } : {};
    const backups = await db.backupRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({ data: backups });
  } catch (err: any) {
    return errorResponse(err);
  }
}
