/**
 * GET  /api/entities/:id/compliance-calendar
 * Returns upcoming + overdue filings for an entity.
 *
 * POST /api/entities/:id/compliance-calendar
 * Mark a filing as filed (with acknowledgment number)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit, logEntityAccess } from "../../_middleware";
import {
  generateComplianceCalendar,
  getOverdueFilings,
  getUpcomingFilings,
} from "@/lib/entity/compliance-calendar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    // Rate limit
    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;

    const url = new URL(req.url);
    const monthsAhead = parseInt(url.searchParams.get("months") || "12");

    // Generate calendar from entity type
    const calendar = generateComplianceCalendar(
      entity.entityType as any,
      new Date(),
      monthsAhead
    );

    // Cross-reference with filed returns in DB
    const filedFilings = await db.entityFiling.findMany({
      where: {
        entityId: entity.id,
        status: "filed",
      },
      select: { filingId: true, period: true, filedDate: true, acknowledgmentNumber: true },
    });

    // Mark entries that are already filed
    const enrichedCalendar = calendar.map((entry) => {
      const filed = filedFilings.find(
        (f) => f.filingId === entry.filing.id && f.period === entry.filing.frequency
      );
      return {
        ...entry,
        filedDate: filed?.filedDate || null,
        acknowledgmentNumber: filed?.acknowledgmentNumber || null,
        isFiled: !!filed,
      };
    });

    const overdue = getOverdueFilings(entity.entityType as any);
    const upcoming = getUpcomingFilings(entity.entityType as any, 10);

    return Response.json({
      data: {
        calendar: enrichedCalendar,
        overdue: overdue.map((e) => ({ ...e, filing: e.filing })),
        upcoming: upcoming.map((e) => ({ ...e, filing: e.filing })),
        summary: {
          totalUpcoming: calendar.filter((e) => e.status !== "overdue").length,
          totalOverdue: overdue.length,
          criticalDue: calendar.filter((e) => e.status === "due-soon" && e.filing.priority === "critical").length,
        },
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
