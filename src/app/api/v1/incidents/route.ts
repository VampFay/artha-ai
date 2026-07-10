/**
 * Incident reports
 * GET  /api/v1/incidents
 * POST /api/v1/incidents
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");

    const where = ctx.tenantId ? { tenantId: ctx.tenantId } : {};
    const incidents = await db.incidentReport.findMany({
      where,
      orderBy: { detectedAt: "desc" },
      take: 100,
    });
    return Response.json({
      data: incidents.map((i) => ({
        ...i,
        affectedSystems: i.affectedSystemsJson ? JSON.parse(i.affectedSystemsJson) : [],
        affectedSystemsJson: undefined,
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

    const body = await req.json();
    const incident = await db.incidentReport.create({
      data: {
        tenantId: ctx.tenantId,
        title: body.title,
        severity: body.severity,
        status: "open",
        description: body.description,
        affectedSystemsJson: body.affectedSystems ? JSON.stringify(body.affectedSystems) : null,
        reporterId: ctx.userId,
        detectedAt: body.detectedAt ? new Date(body.detectedAt) : new Date(),
      },
    });

    return Response.json({ data: incident }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
