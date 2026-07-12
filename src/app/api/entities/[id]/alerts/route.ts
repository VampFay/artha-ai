/**
 * GET /api/entities/:id/alerts
 * Get proactive tax + compliance alerts for an entity.
 */

import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { getProactiveAlerts } from "@/lib/ai/tax-advisor";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const alerts = await getProactiveAlerts(entity.id);

    return Response.json({ data: alerts });
  } catch (err: any) {
    return errorResponse(err);
  }
}
