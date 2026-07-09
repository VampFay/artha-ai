/**
 * GET  /api/entities/:id/filings  — List filings
 * POST /api/entities/:id/filings  — Create/mark filing as filed
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const financialYear = url.searchParams.get("financial_year");

    const filings = await db.entityFiling.findMany({
      where: {
        entityId: entity.id,
        ...(status ? { status } : {}),
        ...(financialYear ? { financialYear } : {}),
      },
      orderBy: { dueDate: "desc" },
      take: 100,
    });

    return Response.json({ data: filings });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const body = await req.json();
    const { filingId, filingName, form, dueDate, financialYear, period, acknowledgmentNumber, filedDate, notes } = body;

    const filing = await db.entityFiling.create({
      data: {
        entityId: entity.id,
        filingId,
        filingName,
        form,
        financialYear: financialYear || null,
        period: period || null,
        dueDate: new Date(dueDate),
        filedDate: filedDate ? new Date(filedDate) : new Date(),
        status: "filed",
        acknowledgmentNumber: acknowledgmentNumber || null,
        filedBy: ctx.userId,
        notes: notes || null,
      },
    });

    await appendAuditEntry({
      tenantId: entity.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.filing.filed",
      resourceType: "entity",
      resourceId: entity.id,
      details: { filingId, form, acknowledgmentNumber },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({ data: filing }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
