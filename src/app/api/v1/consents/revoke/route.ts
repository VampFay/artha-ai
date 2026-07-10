/**
 * Revoke consent
 * POST /api/v1/consents/revoke
 * Body: { purpose: string }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";

const REQUIRED_PURPOSES = ["document_processing", "tax_analysis"];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const body = await req.json();
    const purpose = body.purpose;

    if (!purpose) return errorResponse({ message: "Missing purpose", statusCode: 400 });

    if (REQUIRED_PURPOSES.includes(purpose)) {
      return errorResponse({
        message: `Cannot revoke required consent: ${purpose}. This consent is necessary for the core service. To stop processing, please submit a data subject request for account erasure.`,
        statusCode: 400,
      });
    }

    // Revoke all active grants for this purpose
    const result = await db.consentRecord.updateMany({
      where: { userId: ctx.userId, purpose, status: "granted" },
      data: { status: "revoked", revokedAt: new Date() },
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "consent.revoked",
      details: { purpose, revokedCount: result.count },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return Response.json({ data: { purpose, revoked: result.count } });
  } catch (err: any) {
    return errorResponse(err);
  }
}
