/**
 * Data Processing Records (GDPR Art. 30)
 * GET  /api/v1/processing-records
 * POST /api/v1/processing-records
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const records = await db.dataProcessingRecord.findMany({
      where: { tenantId: ctx.tenantId },
    });
    return Response.json({
      data: records.map((r) => ({
        ...r,
        dataCategories: r.dataCategoriesJson ? JSON.parse(r.dataCategoriesJson) : [],
        dataSubjects: r.dataSubjectsJson ? JSON.parse(r.dataSubjectsJson) : [],
        recipients: r.recipientsJson ? JSON.parse(r.recipientsJson) : [],
        dataCategoriesJson: undefined,
        dataSubjectsJson: undefined,
        recipientsJson: undefined,
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const record = await db.dataProcessingRecord.create({
      data: {
        tenantId: ctx.tenantId,
        activityName: body.activityName,
        purpose: body.purpose,
        dataCategoriesJson: JSON.stringify(body.dataCategories || []),
        dataSubjectsJson: JSON.stringify(body.dataSubjects || []),
        recipientsJson: JSON.stringify(body.recipients || []),
        transferMechanism: body.transferMechanism || null,
        retentionPeriod: body.retentionPeriod || "7 years",
        lawfulBasis: body.lawfulBasis || "consent",
        dpiCompleted: body.dpiCompleted || false,
        riskLevel: body.riskLevel || "medium",
      },
    });

    return Response.json({ data: record }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
