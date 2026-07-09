/**
 * GET    /api/entities/:id  — Get entity details
 * PATCH  /api/entities/:id  — Update entity
 * DELETE /api/entities/:id  — Deactivate entity (soft delete)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../_helpers";
import { ENTITY_TYPES, type EntityType } from "@/lib/entity/types";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const def = ENTITY_TYPES[entity.entityType as EntityType];

    // Get team members, recent filings, recent notices
    const [teamMembers, recentFilings, notices, transactions] = await Promise.all([
      db.entityTeamMember.findMany({
        where: { entityId: entity.id, isActive: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      db.entityFiling.findMany({
        where: { entityId: entity.id },
        orderBy: { dueDate: "desc" },
        take: 10,
      }),
      db.entityNotice.findMany({
        where: { entityId: entity.id },
        orderBy: { issuedDate: "desc" },
        take: 5,
      }),
      db.entityTransaction.count({ where: { entityId: entity.id } }),
    ]);

    return Response.json({
      data: {
        id: entity.id,
        name: entity.name,
        legalName: entity.legalName,
        entityType: entity.entityType,
        entityTypeDef: def ? {
          label: def.label,
          shortLabel: def.shortLabel,
          category: def.category,
          description: def.description,
          regulators: def.regulators,
          taxRegime: def.taxRegime,
          gstApplicable: def.gstApplicable,
          gstDefaultRate: def.gstDefaultRate,
          tdsApplicable: def.tdsApplicable,
          tcsApplicable: def.tcsApplicable,
          csrApplicable: def.csrApplicable,
          matApplicable: def.matApplicable,
          transferPricingRisk: def.transferPricingRisk,
          iconEmoji: def.iconEmoji,
        } : null,
        industrySector: entity.industrySector,
        pan: entity.pan,
        gstin: entity.gstin,
        cin: entity.cin,
        tan: entity.tan,
        incorporationDate: entity.incorporationDate,
        registeredState: entity.registeredState,
        registeredAddress: entity.registeredAddress,
        city: entity.city,
        pincode: entity.pincode,
        contactEmail: entity.contactEmail,
        contactPhone: entity.contactPhone,
        website: entity.website,
        turnoverLastYear: entity.turnoverLastYear,
        netWorth: entity.netWorth,
        isActive: entity.isActive,
        metadata: entity.metadataJson ? JSON.parse(entity.metadataJson) : null,
        teamMembers: teamMembers.map((tm) => ({
          id: tm.id,
          userId: tm.userId,
          name: tm.user.name,
          email: tm.user.email,
          role: tm.role,
          acceptedAt: tm.acceptedAt,
        })),
        recentFilings: recentFilings.map((f) => ({
          id: f.id,
          filingName: f.filingName,
          form: f.form,
          dueDate: f.dueDate,
          filedDate: f.filedDate,
          status: f.status,
        })),
        recentNotices: notices,
        transactionCount: transactions,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const body = await req.json();
    const allowed = [
      "name", "legalName", "industrySector", "pan", "gstin", "cin", "tan",
      "incorporationDate", "registeredState", "registeredAddress", "city",
      "pincode", "contactEmail", "contactPhone", "website",
      "turnoverLastYear", "netWorth", "isActive",
    ];
    const update: any = {};
    for (const k of allowed) if (k in body) {
      if (k === "incorporationDate" && body[k]) {
        update[k] = new Date(body[k]);
      } else {
        update[k] = body[k];
      }
    }
    if (body.metadata) update.metadataJson = JSON.stringify(body.metadata);

    const updated = await db.entity.update({ where: { id: entity.id }, data: update });

    await appendAuditEntry({
      tenantId: entity.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.updated",
      resourceType: "entity",
      resourceId: entity.id,
      details: update,
      ipAddress: ctx.ipAddress,
    });

    return Response.json({ data: { id: updated.id, updatedAt: updated.updatedAt } });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    // Soft delete — mark as inactive
    await db.entity.update({
      where: { id: entity.id },
      data: { isActive: false },
    });

    await appendAuditEntry({
      tenantId: entity.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.deactivated",
      resourceType: "entity",
      resourceId: entity.id,
      ipAddress: ctx.ipAddress,
    });

    return new Response(null, { status: 204 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
