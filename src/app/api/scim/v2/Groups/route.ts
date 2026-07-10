/**
 * SCIM 2.0 Groups endpoint
 * GET  /api/scim/v2/Groups  — list groups (returns system roles as groups)
 * POST /api/scim/v2/Groups  — create group (not supported — system roles only)
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateScimRequest } from "@/lib/security/scim";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const authResult = await authenticateScimRequest(bearer);
  if (!authResult) {
    return NextResponse.json(
      { schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Unauthorized", status: "401" },
      { status: 401 }
    );
  }

  // Map system roles to SCIM groups
  const roles = await db.role.findMany({
    where: { tenantId: authResult.tenantId },
    include: { users: { include: { user: true } } },
  });

  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: roles.length,
    startIndex: 1,
    itemsPerPage: roles.length,
    Resources: roles.map((r) => ({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      id: r.id,
      displayName: r.name,
      members: r.users.map((ur) => ({
        value: ur.userId,
        display: ur.user.email,
      })),
    })),
  });
}
