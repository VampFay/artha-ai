/**
 * POST /api/entities/:id/gst-returns
 * Generate GSTR-1 or GSTR-3B JSON for download.
 * Body: { type: "gstr1" | "gstr3b", period: "MMYYYY" }
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { checkEntityRateLimit } from "../../_middleware";
import { generateGstr1, generateGstr3B } from "@/lib/gst/gstr-generator";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const rateLimited = await checkEntityRateLimit(req, ctx);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const { type, period } = body;

    if (!type || !period) {
      return errorResponse({ message: "Missing 'type' (gstr1/gstr3b) or 'period' (MMYYYY)", statusCode: 400 });
    }

    if (!entity.gstin) {
      return errorResponse({ message: "Entity has no GSTIN configured", statusCode: 400 });
    }

    let result;
    if (type === "gstr1") {
      result = await generateGstr1(entity.id, entity.gstin, period);
    } else if (type === "gstr3b") {
      result = await generateGstr3B(entity.id, entity.gstin, period);
    } else {
      return errorResponse({ message: `Invalid type: ${type}. Use 'gstr1' or 'gstr3b'`, statusCode: 400 });
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
