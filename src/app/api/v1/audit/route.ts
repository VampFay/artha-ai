/**
 * Audit log endpoint (read-only)
 * GET /api/v1/audit
 * Returns hash-chained audit entries for the current tenant.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { verifyAuditChain } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 1000);
    const cursor = url.searchParams.get("cursor");
    const action = url.searchParams.get("action");

    const entries = await db.auditChainEntry.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(action ? { action } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Verify chain integrity on first page only (for performance)
    let chainVerification: Awaited<ReturnType<typeof verifyAuditChain>> | null = null;
    if (!cursor) {
      chainVerification = await verifyAuditChain(ctx.tenantId, 1000);
    }

    return Response.json({
      data: entries,
      meta: {
        nextCursor: entries.length === limit ? entries[entries.length - 1].id : null,
        chainIntegrity: chainVerification,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
