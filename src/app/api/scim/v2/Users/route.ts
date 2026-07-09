/**
 * SCIM 2.0 Users endpoint
 * GET    /api/scim/v2/Users       — list/search
 * POST   /api/scim/v2/Users       — create
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateScimRequest,
  scimListUsers,
  scimCreateUser,
  ScimError,
} from "@/lib/security/scim";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const authResult = await authenticateScimRequest(bearer);
    if (!authResult) {
      return NextResponse.json(
        { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const result = await scimListUsers(
      authResult.tenantId,
      {
        startIndex: parseInt(url.searchParams.get("startIndex") || "1"),
        count: parseInt(url.searchParams.get("count") || "100"),
        filter: url.searchParams.get("filter") || undefined,
      },
      `${req.nextUrl.origin}/api/scim/v2`
    );

    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof ScimError) {
      return NextResponse.json(err.toScimError(), { status: err.status });
    }
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const authResult = await authenticateScimRequest(bearer);
    if (!authResult) {
      return NextResponse.json(
        { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = await scimCreateUser(
      authResult.tenantId,
      body,
      `${req.nextUrl.origin}/api/scim/v2`
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof ScimError) {
      return NextResponse.json(err.toScimError(), { status: err.status });
    }
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}
