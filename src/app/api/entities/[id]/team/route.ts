/**
 * GET  /api/entities/:id/team  — List team members
 * POST /api/entities/:id/team  — Invite team member
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/security/middleware";
import { getEntityForUser } from "../../_helpers";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const members = await db.entityTeamMember.findMany({
      where: { entityId: entity.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { invitedAt: "desc" },
    });

    return Response.json({
      data: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        invitedAt: m.invitedAt,
        acceptedAt: m.acceptedAt,
        isActive: m.isActive,
      })),
    });
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ctx, entity } = await getEntityForUser(req, id);
    if (!entity) return errorResponse({ message: "Entity not found", statusCode: 404 });

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return errorResponse({ message: "Missing email or role", statusCode: 400 });
    }

    const validRoles = ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"];
    if (!validRoles.includes(role)) {
      return errorResponse({ message: `Invalid role. Must be one of: ${validRoles.join(", ")}`, statusCode: 400 });
    }

    // Find user by email
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse({ message: `User not found with email ${email}. Ask them to register first.`, statusCode: 404 });
    }

    // Check if already member
    const existing = await db.entityTeamMember.findUnique({
      where: { entityId_userId: { entityId: entity.id, userId: user.id } },
    });
    if (existing) {
      return errorResponse({ message: "User is already a team member", statusCode: 409 });
    }

    const member = await db.entityTeamMember.create({
      data: {
        entityId: entity.id,
        userId: user.id,
        role,
        invitedBy: ctx.userId,
      },
    });

    await appendAuditEntry({
      tenantId: entity.tenantId,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "entity.team.invited",
      resourceType: "entity",
      resourceId: entity.id,
      details: { invitedUserId: user.id, invitedEmail: email, role },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: {
        id: member.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role,
        invitedAt: member.invitedAt,
      },
    }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
