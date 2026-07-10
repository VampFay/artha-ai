/**
 * Delete webhook
 * DELETE /api/v1/webhooks/:id
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "webhooks", "delete");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const { id } = await params;
    await db.webhook.deleteMany({ where: { id, tenantId: ctx.tenantId } });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "webhook.deleted",
      details: { webhookId: id },
      ipAddress: ctx.ipAddress,
    });

    return new Response(null, { status: 204 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
