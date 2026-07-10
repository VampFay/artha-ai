/**
 * Delete (revoke) API key
 * DELETE /api/v1/api-keys/:id
 */

import { NextRequest } from "next/server";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { revokeApiKey } from "@/lib/security/api-keys";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "api_keys", "delete");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const { id } = await params;
    await revokeApiKey(id, ctx.tenantId);

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "api_key.revoked",
      details: { keyId: id },
      ipAddress: ctx.ipAddress,
    });

    return new Response(null, { status: 204 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
