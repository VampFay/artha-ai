/**
 * Webhook management
 * GET  /api/v1/webhooks
 * POST /api/v1/webhooks
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { generateWebhookSecret } from "@/lib/security/webhooks";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "webhooks", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const webhooks = await db.webhook.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true, url: true, eventsJson: true, isActive: true,
        failureCount: true, lastDeliveryAt: true, createdAt: true, updatedAt: true,
      },
    });

    return Response.json({
      data: webhooks.map((w) => ({
        ...w,
        events: w.eventsJson ? JSON.parse(w.eventsJson) : [],
        eventsJson: undefined,
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "webhooks", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const secret = generateWebhookSecret();

    const webhook = await db.webhook.create({
      data: {
        tenantId: ctx.tenantId,
        url: body.url,
        eventsJson: JSON.stringify(body.events || []),
        secretHash: secret,
        isActive: true,
      },
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "webhook.created",
      details: { webhookId: webhook.id, url: body.url, events: body.events },
      ipAddress: ctx.ipAddress,
    });

    // Return secret ONCE
    return Response.json({
      data: {
        id: webhook.id,
        url: webhook.url,
        events: body.events || [],
        secret,
      },
    }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
