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
import { z } from "zod";

// Zod schema for entity creation
const CreateEntitySchema = z.object({
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional(),
  entityType: z.string().refine((val) => val in ENTITY_TYPES, {
    message: "Invalid entityType",
  }),
  industrySector: z.string().max(255).optional(),
  pan: z.string().max(10).optional(),
  gstin: z.string().max(15).optional(),
  cin: z.string().max(21).optional(),
  tan: z.string().max(10).optional(),
  incorporationDate: z.string().optional(),
  registeredState: z.string().max(100).optional(),
  registeredAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  turnoverLastYear: z.number().min(0).optional(),
  netWorth: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

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

    // Validate with Zod
    const parsed = CreateEntitySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse({
        message: `Validation error: ${parsed.error.errors.map(e => e.message).join(", ")}`,
        statusCode: 400,
      });
    }
    const validated = parsed.data;
    const entityType = validated.entityType as EntityType;

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
        name: validated.name,
        legalName: validated.legalName || body.name,
        entityType,
        industrySector: validated.industrySector || null,
        pan: validated.pan || null,
        gstin: validated.gstin || null,
        cin: validated.cin || null,
        tan: validated.tan || null,
        incorporationDate: validated.incorporationDate ? new Date(body.incorporationDate) : null,
        registeredState: validated.registeredState || null,
        registeredAddress: validated.registeredAddress || null,
        city: validated.city || null,
        pincode: validated.pincode || null,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone || null,
        website: validated.website || null,
        turnoverLastYear: validated.turnoverLastYear || null,
        netWorth: validated.netWorth || null,
        metadataJson: validated.metadata ? JSON.stringify(validated.metadata) : null ? JSON.stringify(body.metadata) : null,
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
      details: { name: validated.name, entityType, pan: validated.pan },
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
