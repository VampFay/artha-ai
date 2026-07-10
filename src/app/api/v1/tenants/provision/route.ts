/**
 * POST /api/v1/tenants/provision
 * Provision a new tenant with system roles + admin user.
 * Called during onboarding (by platform admin).
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, errorResponse } from "@/lib/security/middleware";
import { hashPassword } from "@/lib/auth";
import { seedTenantRoles, assignRole } from "@/lib/security/rbac";
import { appendAuditEntry } from "@/lib/security/audit-chain";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    if (!ctx.isPlatformAdmin) {
      return errorResponse({ message: "Platform admin only", statusCode: 403 });
    }

    const body = await req.json();
    const { name, slug, plan, dataResidency, currency, adminEmail, adminName, adminPassword } = body;

    if (!name || !slug || !adminEmail || !adminName || !adminPassword) {
      return errorResponse({ message: "Missing required fields", statusCode: 400 });
    }

    // Check slug uniqueness
    const existing = await db.tenant.findUnique({ where: { slug } });
    if (existing) {
      return errorResponse({ message: "Tenant slug already taken", statusCode: 409 });
    }

    // Create tenant
    const tenant = await db.tenant.create({
      data: {
        name,
        slug,
        plan: plan || "enterprise",
        dataResidency: dataResidency || "ap-south-1",
        currency: currency || "INR",
        mfaEnforced: true,
        ssoEnforced: false,
      },
    });

    // Seed system roles
    await seedTenantRoles(tenant.id);

    // Create admin user
    const passwordHash = await hashPassword(adminPassword);
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "user",
        tenantId: tenant.id,
      },
    });

    // Assign tenant_admin role
    await assignRole(admin.id, tenant.id, "tenant_admin", ctx.userId);

    await appendAuditEntry({
      tenantId: tenant.id,
      userId: ctx.userId,
      actorType: ctx.actorType,
      action: "tenant.provisioned",
      details: { tenantId: tenant.id, name, slug, plan, adminEmail },
      ipAddress: ctx.ipAddress,
    });

    return Response.json({
      data: {
        tenant_id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        admin_user_id: admin.id,
        admin_email: admin.email,
        sso_endpoints: {
          saml_login: `/api/sso/saml/login?tenant=${slug}`,
          oidc_login: `/api/sso/oidc/login?tenant=${slug}`,
          scim_users: `/api/scim/v2/Users`,
        },
      },
    }, { status: 201 });
  } catch (err: any) {
    return errorResponse(err);
  }
}
