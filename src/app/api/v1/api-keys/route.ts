/**
 * API Key management
 * GET  /api/v1/api-keys         — list keys
 * POST /api/v1/api-keys         — create key (returns raw key once)
 */

import { NextRequest } from "next/server";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { generateApiKey, listApiKeys } from "@/lib/security/api-keys";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "api_keys", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const keys = await listApiKeys(ctx.tenantId);
    return Response.json({
      data: keys.map((k: any) => ({
        ...k,
        scopes: k.scopesJson ? JSON.parse(k.scopesJson) : [],
        ipAllowlist: k.ipAllowlistJson ? JSON.parse(k.ipAllowlistJson) : null,
        scopesJson: undefined,
        ipAllowlistJson: undefined,
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "api_keys", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const { apiKey, record } = await generateApiKey({
      tenantId: ctx.tenantId,
      name: body.name,
      scopes: body.scopes || [],
      rateLimitPerMin: body.rateLimitPerMin,
      ipAllowlist: body.ipAllowlist,
      expiresInDays: body.expiresInDays,
      createdBy: ctx.userId,
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "api_key.created",
      details: { keyId: record.id, name: body.name, scopes: body.scopes },
      ipAddress: ctx.ipAddress,
    });

    // Return raw key ONCE
    return Response.json({ data: { id: record.id, apiKey, name: record.name } }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
