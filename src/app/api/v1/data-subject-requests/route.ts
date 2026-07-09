/**
 * Data Subject Requests (GDPR Art. 15-22 / DPDP Act)
 * GET  /api/v1/data-subject-requests        — list my requests
 * POST /api/v1/data-subject-requests        — submit a new request (access/erasure/etc)
 *
 * Request types:
 *   - access        : data subject wants to see what we have
 *   - erasure       : right to be forgotten
 *   - portability   : machine-readable export
 *   - rectification : correct inaccurate data
 *   - restriction   : limit processing
 *   - objection     : stop processing for specific purpose
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/security/middleware";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { triggerRightToBeForgotten } from "@/lib/compliance/right-to-be-forgotten";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const requests = await db.dataSubjectRequest.findMany({
      where: {
        tenantId: ctx.tenantId,
        OR: [{ userId: ctx.userId }, { email: (await db.user.findUnique({ where: { id: ctx.userId }, select: { email: true } }))?.email }],
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: requests });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.tenantId) return errorResponse({ message: "No tenant", statusCode: 400 });

    const body = await req.json();
    const requestType = body.requestType;
    const validTypes = ["access", "erasure", "portability", "rectification", "restriction", "objection"];
    if (!validTypes.includes(requestType)) {
      return errorResponse({ message: `Invalid requestType. Must be one of: ${validTypes.join(", ")}`, statusCode: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { email: true, name: true },
    });

    const dsr = await db.dataSubjectRequest.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        requestType,
        status: "received",
        email: body.email || user?.email || "",
        description: body.description || null,
      },
    });

    await appendAuditEntry({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "dsr.submitted",
      details: { dsrId: dsr.id, requestType },
      ipAddress: ctx.ipAddress,
    });

    // For erasure requests, immediately trigger the deletion pipeline
    if (requestType === "erasure") {
      // In production: send verification email, wait for confirmation, then execute
      // For dev: trigger immediately
      triggerRightToBeForgotten(ctx.userId, ctx.tenantId, dsr.id).catch((err) => {
        console.error("RTBF failed:", err);
      });
    }

    return Response.json({ data: dsr }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
