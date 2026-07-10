/**
 * SCIM 2.0 User by ID
 * GET    /api/scim/v2/Users/:id   — get
 * PUT    /api/scim/v2/Users/:id   — replace
 * PATCH  /api/scim/v2/Users/:id   — patch
 * DELETE /api/scim/v2/Users/:id   — deactivate
 */

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateScimRequest,
  scimGetUser,
  scimUpdateUser,
  scimPatchUser,
  scimDeleteUser,
  ScimError,
} from "@/lib/security/scim";

async function getAuth(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return authenticateScimRequest(bearer);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuth(req);
    if (!authResult) return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
      { status: 401 }
    );
    const { id } = await params;
    const result = await scimGetUser(authResult.tenantId, id, `${req.nextUrl.origin}/api/scim/v2`);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof ScimError) return NextResponse.json(err.toScimError(), { status: err.status });
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuth(req);
    if (!authResult) return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
      { status: 401 }
    );
    const { id } = await params;
    const body = await req.json();
    const result = await scimUpdateUser(authResult.tenantId, id, body, `${req.nextUrl.origin}/api/scim/v2`);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof ScimError) return NextResponse.json(err.toScimError(), { status: err.status });
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuth(req);
    if (!authResult) return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
      { status: 401 }
    );
    const { id } = await params;
    const body = await req.json();
    const result = await scimPatchUser(authResult.tenantId, id, body, `${req.nextUrl.origin}/api/scim/v2`);
    return NextResponse.json(result);
  } catch (err: any) {
    if (err instanceof ScimError) return NextResponse.json(err.toScimError(), { status: err.status });
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await getAuth(req);
    if (!authResult) return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
      { status: 401 }
    );
    const { id } = await params;
    await scimDeleteUser(authResult.tenantId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    if (err instanceof ScimError) return NextResponse.json(err.toScimError(), { status: err.status });
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: err.message, status: "500" },
      { status: 500 }
    );
  }
}
