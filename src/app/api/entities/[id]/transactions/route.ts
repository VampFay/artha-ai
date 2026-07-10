/**
 * GET  /api/entities/:id/transactions  — List transactions
 * POST /api/entities/:id/transactions  — Add a transaction
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

    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 500);

    const transactions = await db.entityTransaction.findMany({
      where: {
        entityId: entity.id,
        ...(type ? { transactionType: type } : {}),
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return Response.json({ data: transactions });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const body = await req.json();
    const txn = await db.entityTransaction.create({
      data: {
        entityId: entity.id,
        transactionType: body.transactionType,
        amount: body.amount,
        date: new Date(body.date),
        counterparty: body.counterparty || null,
        counterpartyPan: body.counterpartyPan || null,
        description: body.description || null,
        gstRate: body.gstRate || null,
        gstAmount: body.gstAmount || null,
        tdsSection: body.tdsSection || null,
        tdsAmount: body.tdsAmount || null,
        tcsSection: body.tcsSection || null,
        tcsAmount: body.tcsAmount || null,
        invoiceNumber: body.invoiceNumber || null,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : null,
        isGstRegistered: body.isGstRegistered || false,
        metadataJson: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });

    return Response.json({ data: txn }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
