/**
 * POST /api/entities/:id/tds-returns
 * Generate Form 24Q / 26Q JSON for download.
 * Body: { type: "24q" | "26q", assessmentYear: "2024-25", quarter: "Q1" }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit } from "../../_middleware";
import { generateForm24Q, generateForm26Q } from "@/lib/tds/tds-generator";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { type, assessmentYear, quarter } = body;

    if (!type || !assessmentYear || !quarter) {
      return errorResponse({ message: "Missing 'type' (24q/26q), 'assessmentYear', or 'quarter'", statusCode: 400 });
    }

    if (!entity.tan) {
      return errorResponse({ message: "Entity has no TAN configured", statusCode: 400 });
    }

    let result;
    if (type === "24q") {
      result = await generateForm24Q(entity.id, entity.tan, assessmentYear, quarter);
    } else if (type === "26q") {
      result = await generateForm26Q(entity.id, entity.tan, assessmentYear, quarter);
    } else {
      return errorResponse({ message: `Invalid type: ${type}. Use '24q' or '26q'`, statusCode: 400 });
    }

    return Response.json({
      data: {
        filename: result.filename,
        json: result.json,
        summary: result.summary,
        downloadUrl: `data:application/json;base64,${Buffer.from(JSON.stringify(result.json, null, 2)).toString("base64")}`,
      },
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}
