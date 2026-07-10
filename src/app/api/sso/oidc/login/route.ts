/**
 * OIDC SSO Login
 * GET /api/sso/oidc/login?tenant=<slug>
 * Redirects to IdP authorization endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  discoverOidcConfig,
  buildAuthorizationUrl,
  generateOidcState,
} from "@/lib/security/oidc";
import { appendAuditEntry } from "@/lib/security/audit-chain";

const REDIRECT_URI = process.env.OIDC_REDIRECT_URI || "https://artha.ai/api/sso/oidc/callback";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenant");
  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
  }

  const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  const conn = await db.ssoConnection.findFirst({
    where: { tenantId: tenant.id, provider: { in: ["oidc", "azure_ad", "okta", "google"] }, isActive: true },
  });
  if (!conn || !conn.oidcIssuer || !conn.oidcClientId) {
    return NextResponse.json({ error: "OIDC not configured for tenant" }, { status: 400 });
  }

  // Discover OIDC config
  const config = await discoverOidcConfig(conn.oidcIssuer).catch((err) => {
    console.error("OIDC discovery failed:", err);
    return null;
  });
  if (!config) {
    return NextResponse.json({ error: "OIDC discovery failed" }, { status: 502 });
  }

  // Generate state + nonce
  const { state, nonce } = generateOidcState();
  const authUrl = buildAuthorizationUrl({
    authorizationEndpoint: config.authorizationEndpoint,
    clientId: conn.oidcClientId,
    redirectUri: REDIRECT_URI,
    state,
    nonce,
  });

  await appendAuditEntry({
    tenantId: tenant.id,
    actorType: "system",
    action: "sso.oidc.login.initiated",
    details: { state, tenantSlug, issuer: conn.oidcIssuer },
  });

  const response = NextResponse.redirect(authUrl);
  // Store state + nonce + tenantSlug in cookies for callback verification
  response.cookies.set("oidc_state", state, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 600, path: "/",
  });
  response.cookies.set("oidc_nonce", nonce, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 600, path: "/",
  });
  response.cookies.set("oidc_tenant", tenantSlug, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 600, path: "/",
  });
  return response;
}
