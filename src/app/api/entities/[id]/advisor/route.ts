/**
 * POST /api/entities/:id/advisor
 * AI Tax Advisor — ask entity-specific tax questions.
 * Body: { message: string, history?: AdvisoryMessage[] }
 */

import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit } from "../../_middleware";
import { getEntityTaxAdvice, getProactiveAlerts } from "@/lib/ai/tax-advisor";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { message, history = [] } = body;

    if (!message) {
      return errorResponse({ message: "Missing 'message' field", statusCode: 400 });
    }

    const response = await getEntityTaxAdvice(entity.id, message, history);

    return Response.json({ data: response });
  } catch (err: any) {
    return errorResponse(err);
  }
}

/**
 * GET /api/entities/:id/advisor
 * Get proactive tax alerts for an entity.
 */

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
