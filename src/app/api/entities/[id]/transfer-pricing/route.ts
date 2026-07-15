/**
 * GET /api/entities/:id/transfer-pricing
 * Generate Form 3CEB data for transfer pricing compliance.
 * Query: ?assessment_year=2024-25
 */

import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit } from "../../_middleware";
import { generateForm3CEB } from "@/lib/tax/transfer-pricing";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;

    const url = new URL(req.url);
    const assessmentYear = url.searchParams.get("assessment_year") || "2024-25";

    const result = await generateForm3CEB(entity.id, assessmentYear);

    return Response.json({ data: result.data, summary: result.summary });
  } catch (err: any) {
    return errorResponse(err);
  }
}
