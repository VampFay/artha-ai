/**
 * Entity API helpers — shared CRUD + auth utilities.
 */

import { db } from "@/lib/db";
import { requireAuth, type AuthContext } from "@/lib/security/middleware";
import type { NextRequest } from "next/server";

/**
 * Get an entity by ID, scoped to the user's tenant.
 * Throws 404 if not found or not in user's tenant.
 */
export async function getEntityForUser(req: NextRequest, entityId: string) {
  const ctx = await requireAuth(req);

  // Platform admin can access any entity
  if (ctx.isPlatformAdmin) {
    const entity = await db.entity.findUnique({ where: { id: entityId } });
    if (!entity) return { ctx, entity: null };
    return { ctx, entity };
  }

  // Otherwise, entity must be in user's tenant OR user must be a team member
  const entity = await db.entity.findFirst({
    where: {
      id: entityId,
      OR: [
        { tenantId: ctx.tenantId || "" },
        { teamMembers: { some: { userId: ctx.userId, isActive: true } } },
      ],
    },
  });

  return { ctx, entity };
}

/**
 * Get the user's accessible entities.
 * - Platform admin: all entities
 * - Tenant user: entities in their tenant
 * - Individual user: entities where they're a team member
 */
export async function getAccessibleEntities(ctx: AuthContext) {
  if (ctx.isPlatformAdmin) {
    return db.entity.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { teamMembers: true, filings: true } } },
    });
  }

  if (ctx.tenantId) {
    return db.entity.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { teamMembers: true, filings: true } } },
    });
  }

  // Individual user — entities where they're a team member
  return db.entity.findMany({
    where: { teamMembers: { some: { userId: ctx.userId, isActive: true } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teamMembers: true, filings: true } } },
  });
}
