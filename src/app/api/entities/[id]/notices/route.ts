/**
 * GET  /api/entities/:id/notices  — List tax notices
 * POST /api/entities/:id/notices  — Add a notice (received from authority)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit, logEntityAccess } from "../../_middleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const notices = await db.entityNotice.findMany({
      where: { entityId: entity.id },
      orderBy: { issuedDate: "desc" },
      take: 50,
    });

    return Response.json({ data: notices });
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
    const notice = await db.entityNotice.create({
      data: {
        entityId: entity.id,
        noticeType: body.noticeType,
        noticeNumber: body.noticeNumber || null,
        din: body.din || null,
        issuedBy: body.issuedBy || null,
        issuedDate: new Date(body.issuedDate),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        amountDemand: body.amountDemand || null,
        status: "received",
        notes: body.notes || null,
      },
    });

    return Response.json({ data: notice }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
