/**
 * Tenant info + management
 * GET    /api/v1/tenants/current         — get current tenant info
 * PATCH  /api/v1/tenants/current         — update settings (admin)
 * GET    /api/v1/tenants/current/sso     — list SSO connections
 * POST   /api/v1/tenants/current/sso     — create SSO connection
 * GET    /api/v1/tenants/current/roles   — list roles
 * GET    /api/v1/tenants/current/users   — list tenant users
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { encryptField } from "@/lib/security/field-encryption";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.tenantId) {
      return Response.json({ error: { code: "no_tenant", message: "User is not associated with a tenant" } }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: ctx.tenantId },
      include: {
        whiteLabel: true,
        _count: {
          select: { users: true, apiKeys: true, webhooks: true, ssoConnections: true },
        },
      },
    });

    return Response.json({ data: tenant });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "settings", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const allowed = ["name", "dataResidency", "currency", "mfaEnforced", "ssoEnforced", "featuresJson", "ipAllowlistJson"];
    const update: any = {};
    for (const k of allowed) if (k in body) update[k] = body[k];

    const updated = await db.tenant.update({ where: { id: ctx.tenantId }, data: update });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "tenant.settings.updated",
      details: update,
      ipAddress: ctx.ipAddress,
    });

    return Response.json({ data: updated });
  } catch (err: any) {
    return errorResponse(err);
  }
}
