/**
 * SSO connections for current tenant
 * GET  /api/v1/tenants/current/sso
 * POST /api/v1/tenants/current/sso
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { encryptField } from "@/lib/security/field-encryption";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "sso", "read");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const connections = await db.ssoConnection.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true, provider: true, entityId: true, ssoUrl: true,
        oidcIssuer: true, oidcClientId: true, oidcDiscoveryUrl: true,
        jitProvisioning: true, scimEndpoint: true,
        domainsJson: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });

    return Response.json({ data: connections });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "sso", "write");
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const data: any = {
      tenantId: ctx.tenantId,
      provider: body.provider,
      entityId: body.entityId,
      ssoUrl: body.ssoUrl,
      sloUrl: body.sloUrl,
      x509Cert: body.x509Cert,
      metadataXml: body.metadataXml,
      oidcIssuer: body.oidcIssuer,
      oidcClientId: body.oidcClientId,
      oidcDiscoveryUrl: body.oidcDiscoveryUrl,
      jitProvisioning: body.jitProvisioning ?? true,
      scimEndpoint: body.scimEndpoint,
      domainsJson: body.domains ? JSON.stringify(body.domains) : null,
      isActive: true,
    };

    if (body.oidcClientSecret) {
      data.oidcClientSecretEnc = await encryptField(body.oidcClientSecret);
    }
    if (body.scimToken) {
      data.scimTokenEnc = await encryptField(body.scimToken);
    }

    const conn = await db.ssoConnection.create({ data });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "sso.connection.created",
      details: { provider: body.provider, id: conn.id },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({ data: { id: conn.id, provider: conn.provider } }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
