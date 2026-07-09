/**
 * Granular consent management v2
 * GET  /api/v1/consents
 * POST /api/v1/consents           — grant consent for a purpose
 * POST /api/v1/consents/revoke    — revoke consent
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";

const CONSENT_PURPOSES = {
  document_processing: {
    description: "Process uploaded financial documents for tax and wealth analysis",
    lawfulBasis: "contract",
    required: true, // cannot be revoked — needed for core service
    version: "1.0.0",
  },
  tax_analysis: {
    description: "Compute tax estimates and recommend deductions",
    lawfulBasis: "contract",
    required: true,
    version: "1.0.0",
  },
  analytics: {
    description: "Use anonymized data for product improvement analytics",
    lawfulBasis: "consent",
    required: false,
    version: "1.0.0",
  },
  marketing: {
    description: "Send product updates and promotional communications",
    lawfulBasis: "consent",
    required: false,
    version: "1.0.0",
  },
  ai_training: {
    description: "Use data to train and improve AI models (always anonymized)",
    lawfulBasis: "consent",
    required: false,
    version: "1.0.0",
  },
  data_sharing: {
    description: "Share data with partner financial institutions (with explicit per-instance consent)",
    lawfulBasis: "consent",
    required: false,
    version: "1.0.0",
  },
} as const;

export type ConsentPurpose = keyof typeof CONSENT_PURPOSES;

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);

    const records = await db.consentRecord.findMany({
      where: { userId: ctx.userId, status: "granted" },
      orderBy: { grantedAt: "desc" },
    });

    // Build status map (latest per purpose)
    const statusMap: Record<string, any> = {};
    for (const r of records) {
      if (!statusMap[r.purpose]) statusMap[r.purpose] = r;
    }

    // Augment with purpose definitions
    const result = Object.entries(CONSENT_PURPOSES).map(([key, def]) => ({
      purpose: key,
      description: def.description,
      lawfulBasis: def.lawfulBasis,
      required: def.required,
      version: def.version,
      status: statusMap[key]?.status || "not_granted",
      grantedAt: statusMap[key]?.grantedAt || null,
      expiresAt: statusMap[key]?.expiresAt || null,
    }));

    return Response.json({ data: result });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);

    const body = await req.json();
    const purpose = body.purpose as ConsentPurpose;
    if (!purpose || !CONSENT_PURPOSES[purpose]) {
      return errorResponse({ message: `Invalid purpose. Must be one of: ${Object.keys(CONSENT_PURPOSES).join(", ")}`, statusCode: 400 });
    }

    const def = CONSENT_PURPOSES[purpose];

    // Revoke any previous grant for this purpose
    await db.consentRecord.updateMany({
      where: { userId: ctx.userId, purpose, status: "granted" },
      data: { status: "revoked", revokedAt: new Date() },
    });

    const record = await db.consentRecord.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        purpose,
        purposeVersion: def.version,
        consentText: body.consentText || def.description,
        status: "granted",
        lawfulBasis: def.lawfulBasis,
        evidence: JSON.stringify({
          ip: ctx.ipAddress,
          userAgent: ctx.userAgent,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "consent.granted",
      details: { purpose, version: def.version, recordId: record.id },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return Response.json({ data: record }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
