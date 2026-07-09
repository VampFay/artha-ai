/**
 * SAML Assertion Consumer Service (ACS)
 * POST /api/sso/saml/acs
 * Receives SAML Response from IdP, validates, JIT-provisions user, sets session.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  parseSamlResponse,
  provisionSamlUser,
  type SamlAssertionAttrs,
} from "@/lib/security/saml";
import { createToken, createRefreshToken } from "@/lib/auth";
import { seedTenantRoles, assignRole } from "@/lib/security/rbac";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { recordSecurityEvent } from "@/lib/security/events";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const samlResponseB64 = formData.get("SAMLResponse") as string;
    const relayState = formData.get("RelayState") as string; // tenant slug

    if (!samlResponseB64 || !relayState) {
      return NextResponse.json({ error: "Missing SAMLResponse or RelayState" }, { status: 400 });
    }

    // Look up tenant
    const tenant = await db.tenant.findUnique({ where: { slug: relayState } });
    if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

    const conn = await db.ssoConnection.findFirst({
      where: { tenantId: tenant.id, provider: "saml", isActive: true },
    });
    if (!conn) return NextResponse.json({ error: "SAML not configured" }, { status: 400 });

    // Parse and validate SAML response
    const parsed = parseSamlResponse(samlResponseB64);
    const attrs: SamlAssertionAttrs = {
      nameId: parsed.raw.nameId,
      nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      email: parsed.raw.attributes.email || parsed.raw.nameId,
      firstName: parsed.raw.attributes.givenName || parsed.raw.attributes.firstName,
      lastName: parsed.raw.attributes.surname || parsed.raw.attributes.lastName,
      groups: parsed.raw.attributes.groups ? [parsed.raw.attributes.groups] : [],
      attributes: parsed.raw.attributes,
    };

    if (!attrs.email) {
      await recordSecurityEvent({
        eventType: "sso_failed",
        severity: "medium",
        tenantId: tenant.id,
        details: { reason: "missing_email_in_assertion" },
      });
      return NextResponse.json({ error: "SAML assertion missing email" }, { status: 400 });
    }

    // Ensure roles are seeded
    await seedTenantRoles(tenant.id);

    // Find viewer role for default JIT assignment
    const viewerRole = await db.role.findUnique({
      where: { tenantId_name: { tenantId: tenant.id, name: "viewer" } },
    });

    // JIT-provision user
    const { userId, isNew } = await provisionSamlUser(
      tenant.id,
      attrs,
      viewerRole?.id
    );

    // Issue session
    const accessToken = await createToken(userId);
    const refreshToken = await createRefreshToken(
      userId,
      req.headers.get("user-agent") || undefined,
      req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    );

    await appendAuditEntry({
      tenantId: tenant.id,
      userId,
      actorType: "sso",
      action: "sso.saml.login.success",
      details: { email: attrs.email, isNewUser: isNew, nameId: attrs.nameId },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim(),
      userAgent: req.headers.get("user-agent"),
    });

    // Set cookies + redirect to app
    const response = NextResponse.redirect(new URL("/?sso=success", req.url));
    response.cookies.set("finsight_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });
    response.cookies.set("finsight_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("SAML ACS error:", err);
    return NextResponse.json(
      { error: "SAML authentication failed", detail: err.message },
      { status: 500 }
    );
  }
}
