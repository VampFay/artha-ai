/**
 * OIDC Callback
 * GET /api/sso/oidc/callback?code=...&state=...
 * Exchanges code for tokens, verifies ID token, JIT-provisions user.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  discoverOidcConfig,
  exchangeCodeForTokens,
  verifyIdToken,
  fetchUserinfo,
  provisionOidcUser,
  type OidcUserInfo,
} from "@/lib/security/oidc";
import { getOidcClientSecret } from "@/lib/security/saml";
import { createToken, createRefreshToken } from "@/lib/auth";
import { seedTenantRoles } from "@/lib/security/rbac";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import { recordSecurityEvent } from "@/lib/security/events";

const REDIRECT_URI = process.env.OIDC_REDIRECT_URI || "https://artha.ai/api/sso/oidc/callback";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Verify state against cookie
    const cookieState = req.cookies.get("oidc_state")?.value;
    const nonce = req.cookies.get("oidc_nonce")?.value;
    const tenantSlug = req.cookies.get("oidc_tenant")?.value;

    if (!cookieState || cookieState !== state || !tenantSlug || !nonce) {
      return NextResponse.json({ error: "State mismatch — possible CSRF" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

    const conn = await db.ssoConnection.findFirst({
      where: { tenantId: tenant.id, isActive: true },
    });
    if (!conn || !conn.oidcIssuer || !conn.oidcClientId) {
      return NextResponse.json({ error: "OIDC not configured" }, { status: 400 });
    }

    const clientSecret = await getOidcClientSecret(conn.id);
    if (!clientSecret) {
      return NextResponse.json({ error: "OIDC client secret not set" }, { status: 500 });
    }

    // Discover config
    const config = await discoverOidcConfig(conn.oidcIssuer);

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens({
      tokenEndpoint: config.tokenEndpoint,
      clientId: conn.oidcClientId,
      clientSecret,
      code,
      redirectUri: REDIRECT_URI,
    });

    // Verify ID token
    const { payload } = await verifyIdToken({
      idToken: tokens.id_token,
      issuer: config.issuer,
      clientId: conn.oidcClientId,
      nonce,
      jwksUri: config.jwksUri,
    });

    // Fetch userinfo
    const userinfo = await fetchUserinfo(config.userinfoEndpoint, tokens.access_token);

    // Ensure roles seeded
    await seedTenantRoles(tenant.id);
    const viewerRole = await db.role.findUnique({
      where: { tenantId_name: { tenantId: tenant.id, name: "viewer" } },
    });

    // JIT-provision
    const { userId, isNew } = await provisionOidcUser(
      tenant.id,
      userinfo,
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
      action: "sso.oidc.login.success",
      details: { email: userinfo.email, sub: userinfo.sub, isNewUser: isNew },
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim(),
      userAgent: req.headers.get("user-agent"),
    });

    const response = NextResponse.redirect(new URL("/?sso=success", req.url));
    response.cookies.set("finsight_token", accessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 24 * 60 * 60, path: "/",
    });
    response.cookies.set("finsight_refresh_token", refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", maxAge: 30 * 24 * 60 * 60, path: "/",
    });
    // Clear OIDC cookies
    response.cookies.delete("oidc_state");
    response.cookies.delete("oidc_nonce");
    response.cookies.delete("oidc_tenant");
    return response;
  } catch (err: any) {
    console.error("OIDC callback error:", err);
    await recordSecurityEvent({
      eventType: "sso_failed",
      severity: "medium",
      details: { provider: "oidc", reason: err.message },
    });
    return NextResponse.json(
      { error: "OIDC authentication failed", detail: err.message },
      { status: 500 }
    );
  }
}
