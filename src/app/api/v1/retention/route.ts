/**
 * Retention policies (per resource type, per jurisdiction)
 * GET  /api/v1/retention
 * POST /api/v1/retention
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "retention", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const policies = await db.retentionPolicy.findMany({
      where: { tenantId: ctx.tenantId },
    });
    return Response.json({ data: policies });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "retention", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const policy = await db.retentionPolicy.upsert({
      where: {
        tenantId_resourceType_jurisdiction: {
          tenantId: ctx.tenantId,
          resourceType: body.resourceType,
          jurisdiction: body.jurisdiction || "IN",
        },
      },
      update: {
        retentionDays: body.retentionDays,
        action: body.action || "delete",
      },
      create: {
        tenantId: ctx.tenantId,
        resourceType: body.resourceType,
        retentionDays: body.retentionDays,
        action: body.action || "delete",
        jurisdiction: body.jurisdiction || "IN",
      },
    });

    return Response.json({ data: policy }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
