/**
 * List roles for current tenant
 * GET /api/v1/tenants/current/roles
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "users", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const roles = await db.role.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        _count: { select: { users: true } },
        permissions: { include: { permission: true } },
      },
    });

    return Response.json({
      data: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        userCount: r._count.users,
        permissions: r.permissions.map((rp) => ({
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
