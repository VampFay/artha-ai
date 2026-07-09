/**
 * List users for current tenant
 * GET /api/v1/tenants/current/users
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "users", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const users = await db.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true, updatedAt: true,
        tenantRoles: { include: { role: { select: { id: true, name: true } } } },
      },
    });

    return Response.json({
      data: users.map((u) => ({
        id: u.id, name: u.name, email: u.email, role: u.role,
        createdAt: u.createdAt, updatedAt: u.updatedAt,
        tenantRoles: u.tenantRoles.map((tr) => tr.role),
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
