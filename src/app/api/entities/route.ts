/**
 * GET  /api/entities         — List user's accessible entities
 * POST /api/entities         — Create new entity
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/security/middleware";
import { getAccessibleEntities } from "./_helpers";
import { ENTITY_TYPES, type EntityType } from "@/lib/entity/types";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const entities = await getAccessibleEntities(ctx);

    return Response.json({
      data: entities.map((e: any) => ({
        id: e.id,
        name: e.name,
        legalName: e.legalName,
        entityType: e.entityType,
        entityTypeLabel: ENTITY_TYPES[e.entityType as EntityType]?.label || e.entityType,
        iconEmoji: ENTITY_TYPES[e.entityType as EntityType]?.iconEmoji || "🏢",
        industrySector: e.industrySector,
        pan: e.pan,
        gstin: e.gstin,
        cin: e.cin,
        registeredState: e.registeredState,
        city: e.city,
        turnoverLastYear: e.turnoverLastYear,
        isActive: e.isActive,
        teamCount: e._count?.teamMembers || 0,
        filingCount: e._count?.filings || 0,
        createdAt: e.createdAt,
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const body = await req.json();

    // Validate entity type
    const entityType = body.entityType as EntityType;
    if (!entityType || !ENTITY_TYPES[entityType]) {
      return errorResponse({
        message: `Invalid entityType. Must be one of: ${Object.keys(ENTITY_TYPES).join(", ")}`,
        statusCode: 400,
      });
    }

    if (!body.name) {
      return errorResponse({ message: "Missing required field: name", statusCode: 400 });
    }

    // Determine tenant ID — user's tenant if available, else create standalone
    const tenantId = ctx.tenantId || `solo_${ctx.userId}`;

    // If user has no tenant, create one for this entity
    if (!ctx.tenantId) {
      const existingTenant = await db.tenant.findUnique({ where: { id: tenantId } });
      if (!existingTenant) {
        await db.tenant.create({
          data: {
            id: tenantId,
            name: `${ctx.userId}'s Entities`,
            slug: tenantId,
            plan: "individual",
            dataResidency: "ap-south-1",
            currency: "INR",
          },
        });
        // Update user's tenantId
        await db.user.update({ where: { id: ctx.userId }, data: { tenantId } });
      }
    }

    const entity = await db.entity.create({
      data: {
        tenantId,
        name: body.name,
        legalName: body.legalName || body.name,
        entityType,
        industrySector: body.industrySector || null,
        pan: body.pan || null,
        gstin: body.gstin || null,
        cin: body.cin || null,
        tan: body.tan || null,
        incorporationDate: body.incorporationDate ? new Date(body.incorporationDate) : null,
        registeredState: body.registeredState || null,
        registeredAddress: body.registeredAddress || null,
        city: body.city || null,
        pincode: body.pincode || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        website: body.website || null,
        turnoverLastYear: body.turnoverLastYear || null,
        netWorth: body.netWorth || null,
        metadataJson: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });

    // Add creator as tenant_admin team member
    await db.entityTeamMember.create({
      data: {
        entityId: entity.id,
        userId: ctx.userId,
        role: "tenant_admin",
        invitedBy: ctx.userId,
        acceptedAt: new Date(),
      },
    });

    await appendAuditEntry({
      tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.created",
      resourceType: "entity",
      resourceId: entity.id,
      details: { name: body.name, entityType, pan: body.pan },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: {
        id: entity.id,
        name: entity.name,
        entityType: entity.entityType,
        createdAt: entity.createdAt,
      },
    }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
