/**
 * SAML SSO Login
 * GET /api/sso/saml/login?tenant=<slug>
 * Redirects user to IdP SSO URL with AuthnRequest.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildAuthnRequest,
  encodeSamlMessage,
} from "@/lib/security/saml";
import { appendAuditEntry } from "@/lib/security/audit-chain";

const SP_ENTITY_ID = process.env.SAML_SP_ENTITY_ID || "https://artha.ai/saml";
const SP_ACS_URL = process.env.SAML_SP_ACS_URL || "https://artha.ai/api/sso/saml/acs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenant");
  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
  }

  // Find SSO connection for tenant
  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  const conn = await db.ssoConnection.findFirst({
    where: { tenantId: tenant.id, provider: "saml", isActive: true },
  });
  if (!conn || !conn.ssoUrl) {
    return NextResponse.json({ error: "SAML not configured for tenant" }, { status: 400 });
  }

  // Build AuthnRequest
  const requestId = crypto.randomUUID().replace(/-/g, "");
  const authnRequest = buildAuthnRequest({
    id: requestId,
    issueInstant: new Date().toISOString(),
    destination: conn.ssoUrl,
    acsUrl: SP_ACS_URL,
    entityId: SP_ENTITY_ID,
  });

  // Store request ID in short-lived cookie for CSRF protection
  const stateCookie = `saml_state_${requestId}`;
  const redirectUrl = new URL(conn.ssoUrl);
  redirectUrl.searchParams.set("SAMLRequest", encodeSamlMessage(authnRequest));
  redirectUrl.searchParams.set("RelayState", tenantSlug);

  await appendAuditEntry({
    tenantId: tenant.id,
    actorType: "system",
    action: "sso.saml.login.initiated",
    details: { requestId, tenantSlug, idpUrl: conn.ssoUrl },
  });

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(stateCookie, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 min
    path: "/",
  });
  return response;
}
