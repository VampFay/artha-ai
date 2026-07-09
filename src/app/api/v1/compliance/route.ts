/**
 * Compliance dashboard
 * GET /api/v1/compliance
 * Returns status of all compliance frameworks + data residency info.
 */

import { NextRequest } from "next/server";
import { requireAuth, requirePermission, errorResponse } from "@/lib/security/middleware";
import { getComplianceSummary, COMPLIANCE_FRAMEWORKS } from "@/lib/compliance/frameworks";
import { RESIDENCY_POLICIES } from "@/lib/compliance/data-residency";
import { verifyAuditChain } from "@/lib/security/audit-chain";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    requirePermission(ctx, "audit", "read");

    // Audit chain integrity check
    let chainIntegrity: Awaited<ReturnType<typeof verifyAuditChain>> | null = null;
    if (ctx.tenantId) {
      chainIntegrity = await verifyAuditChain(ctx.tenantId, 1000);
    }

    // Open incidents count
    const openIncidents = ctx.tenantId
      ? await db.incidentReport.count({ where: { tenantId: ctx.tenantId, status: { in: ["open", "investigating"] } } })
      : 0;

    // Unresolved high-severity security events
    const highSeverityEvents = ctx.tenantId
      ? await db.securityEvent.count({
          where: {
            tenantId: ctx.tenantId,
            resolved: false,
            severity: { in: ["high", "critical"] },
          },
        })
      : 0;

    // Open DSRs
    const openDsrs = ctx.tenantId
      ? await db.dataSubjectRequest.count({
          where: { tenantId: ctx.tenantId, status: { in: ["received", "verifying", "in_progress"] } },
        })
      : 0;

    return Response.json({
      data: {
        frameworks: getComplianceSummary(),
        frameworksDetail: COMPLIANCE_FRAMEWORKS.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          jurisdiction: f.jurisdiction,
          mandatory: f.mandatory,
          status: f.status,
          certifyingBody: f.certifyingBody,
          certificateExpiry: f.certificateExpiry,
          controls: f.controls,
        })),
        dataResidency: {
          policies: RESIDENCY_POLICIES,
          tenantRegion: ctx.tenantId ? (await db.tenant.findUnique({ where: { id: ctx.tenantId }, select: { dataResidency: true } }))?.dataResidency : null,
        },
        auditChain: chainIntegrity,
        openIncidents,
        highSeverityEvents,
        openDataSubjectRequests: openDsrs,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
