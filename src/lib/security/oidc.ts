/**
 * OIDC (OpenID Connect) Client
 * ----------------------------
 * Implements the OIDC Authorization Code flow:
 *   1. User accesses /api/sso/oidc/login?tenant=acme-bank
 *   2. Redirect to IdP authorization endpoint
 *   3. IdP redirects back with ?code=...
 *   4. Exchange code for tokens at IdP token endpoint
 *   5. Verify ID token JWT, extract userinfo
 *   6. JIT-provision user, create session
 *
 * Supports: Azure AD, Okta, Google, Keycloak, Auth0.
 */

import { createHash, randomBytes } from "crypto";
import { db } from "../db";
import { getOidcClientSecret } from "./saml";

export interface OidcConfig {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
}

export interface OidcTokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}

export interface OidcUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  groups?: string[];
}

/**
 * Discover OIDC config from issuer's well-known endpoint.
 */
export async function discoverOidcConfig(issuer: string): Promise<OidcConfig> {
  const url = `${issuer.replace(/\/$/, "")}/.well-known/openid-configuration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  const doc = await res.json();
  return {
    issuer: doc.issuer,
    authorizationEndpoint: doc.authorization_endpoint,
    tokenEndpoint: doc.token_endpoint,
    userinfoEndpoint: doc.userinfo_endpoint,
    jwksUri: doc.jwks_uri,
  };
}

/**
 * Build the authorization URL (step 1-2).
 */
export function buildAuthorizationUrl(params: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  scope?: string;
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("scope", params.scope || "openid email profile");
  return url.toString();
}

/**
 * Generate state + nonce for CSRF protection.
 */
export function generateOidcState(): { state: string; nonce: string } {
  return {
    state: randomBytes(16).toString("hex"),
    nonce: randomBytes(16).toString("hex"),
  };
}

/**
 * Exchange authorization code for tokens (step 4).
 */
export async function exchangeCodeForTokens(params: {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<OidcTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    client_secret: params.clientSecret,
  });

  const res = await fetch(params.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${errText}`);
  }

  return res.json();
}

/**
 * Verify an OIDC ID token.
 * Checks: signature (via JWKS), issuer, audience, nonce, expiration.
 */
export async function verifyIdToken(params: {
  idToken: string;
  issuer: string;
  clientId: string;
  nonce: string;
  jwksUri: string;
}): Promise<{ payload: any }> {
  // Use jose's remote JWKS verification
  const { createRemoteJWKSet, jwtVerify } = await import("jose");
  const remoteJwks = createRemoteJWKSet(new URL(params.jwksUri));

  const { payload } = await jwtVerify(
    params.idToken,
    async (protectedHeader: any, _token: any) => {
      return remoteJwks(protectedHeader, _token);
    },
    {
      issuer: params.issuer,
      audience: params.clientId,
    }
  );

  // Verify nonce manually (jose doesn't have a direct nonce option in some versions)
  if (payload.nonce && payload.nonce !== params.nonce) {
    throw new Error("Nonce mismatch — possible replay attack");
  }

  return { payload };
}

/**
 * Fetch userinfo from IdP.
 */
export async function fetchUserinfo(
  userinfoEndpoint: string,
  accessToken: string
): Promise<OidcUserInfo> {
  const res = await fetch(userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Userinfo fetch failed: ${res.status}`);
  return res.json();
}

/**
 * JIT-provision a user from OIDC userinfo.
 */
export async function provisionOidcUser(
  tenantId: string,
  info: OidcUserInfo,
  roleId?: string
): Promise<{ userId: string; isNew: boolean }> {
  const email = info.email;
  if (!email) throw new Error("OIDC userinfo missing email");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.tenantId) {
      await db.user.update({ where: { id: existing.id }, data: { tenantId } });
    }
    const userRole = await db.userRole.findUnique({
      where: { userId_tenantId: { userId: existing.id, tenantId } },
    });
    if (!userRole && roleId) {
      await db.userRole.create({
        data: { userId: existing.id, tenantId, roleId, assignedBy: "oidc-jit" },
      });
    }
    return { userId: existing.id, isNew: false };
  }

  const newUser = await db.user.create({
    data: {
      email,
      name: info.name || [info.given_name, info.family_name].filter(Boolean).join(" ") || email,
      passwordHash: "!sso-only!",
      role: "user",
      tenantId,
    },
  });

  if (roleId) {
    await db.userRole.create({
      data: { userId: newUser.id, tenantId, roleId, assignedBy: "oidc-jit" },
    });
  }

  return { userId: newUser.id, isNew: true };
}
