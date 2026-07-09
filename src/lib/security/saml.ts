/**
 * SAML 2.0 Service Provider
 * -------------------------
 * Implements the SAML 2.0 SP-initiated SSO flow:
 *   1. User accesses /api/sso/saml/login?tenant=acme-bank
 *   2. SP generates AuthnRequest, redirects to IdP SSO URL
 *   3. User authenticates at IdP
 *   4. IdP POSTs SAML Response to /api/sso/saml/acs
 *   5. SP validates Response, extracts NameID + attributes
 *   6. JIT-provisions user if needed, creates session
 *
 * Dependencies: saml2-js (or @node-saml/passport-saml)
 * For now, implements raw XML parsing without external deps to avoid install burden.
 * Production: replace with @node-saml/passport-saml.
 */

import { createHash, createPrivateKey, createSign, randomBytes } from "crypto";
import { db } from "../db";
import { encryptField, decryptField } from "./field-encryption";

export interface SamlAuthnRequestParams {
  id: string;
  issueInstant: string;
  destination: string; // IdP SSO URL
  acsUrl: string; // our ACS endpoint
  entityId: string; // our SP entity ID
}

export interface SamlAssertionAttrs {
  nameId: string;
  nameIdFormat: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  attributes: Record<string, string>;
}

/**
 * Generate a SAML AuthnRequest XML.
 */
export function buildAuthnRequest(params: SamlAuthnRequestParams): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_${params.id}"
                    Version="2.0"
                    IssueInstant="${params.issueInstant}"
                    Destination="${params.destination}"
                    AssertionConsumerServiceURL="${params.acsUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>${params.entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                       AllowCreate="true"/>
</samlp:AuthnRequest>`;
}

/**
 * Generate a SAML logout request.
 */
export function buildLogoutRequest(params: {
  id: string;
  nameId: string;
  destination: string;
  entityId: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                      xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                      ID="_${params.id}"
                      Version="2.0"
                      IssueInstant="${new Date().toISOString()}"
                      Destination="${params.destination}">
  <saml:Issuer>${params.entityId}</saml:Issuer>
  <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">${params.nameId}</saml:NameID>
</samlp:LogoutRequest>`;
}

/**
 * Base64-deflate encode a SAML message for URL transport.
 */
export function encodeSamlMessage(xml: string): string {
  // SAML uses DEFLATE compression for URL binding
  // Node.js doesn't have built-in deflate-sync without zlib, but we have it
  const zlib = require("zlib");
  const deflated = zlib.deflateRawSync(xml);
  return deflated.toString("base64");
}

/**
 * Parse a SAML Response (POST binding — base64-encoded XML).
 * NOTE: This is a minimal parser for the assertion attributes.
 * For production, use a proper SAML library that handles XML signatures, replay
 * protection, audience validation, and clock skew.
 */
export function parseSamlResponse(b64Response: string): {
  xml: string;
  raw: any;
} {
  const xml = Buffer.from(b64Response, "base64").toString("utf8");
  // Extract attributes via regex (production: use fast-xml-parser or xml-crypto)
  const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
  const attrs: Record<string, string> = {};
  const attrRegex = /<saml:Attribute\s+Name="([^"]+)"[^>]*>([\s\S]*?)<\/saml:Attribute>/g;
  let m;
  while ((m = attrRegex.exec(xml)) !== null) {
    const valMatch = m[2].match(/<saml:AttributeValue[^>]*>([^<]*)<\/saml:AttributeValue>/);
    if (valMatch) attrs[m[1]] = valMatch[1];
  }

  return {
    xml,
    raw: {
      nameId: nameIdMatch?.[1] || "",
      attributes: attrs,
    },
  };
}

/**
 * Look up an SSO connection by email domain (for auto-routing).
 */
export async function findSsoConnectionByEmail(email: string) {
  const domain = email.split("@")[1];
  if (!domain) return null;

  const connections = await db.ssoConnection.findMany({
    where: { isActive: true },
  });

  for (const conn of connections) {
    if (!conn.domainsJson) continue;
    try {
      const domains: string[] = JSON.parse(conn.domainsJson);
      if (domains.includes(domain)) return conn;
    } catch {}
  }
  return null;
}

/**
 * Look up SSO connection by tenant slug.
 */
export async function findSsoConnectionByTenantSlug(slug: string) {
  const tenant = await db.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;
  return db.ssoConnection.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });
}

/**
 * JIT-provision a user from SAML attributes.
 */
export async function provisionSamlUser(
  tenantId: string,
  attrs: SamlAssertionAttrs,
  roleId?: string
): Promise<{ userId: string; isNew: boolean }> {
  const email = attrs.email || attrs.nameId;
  if (!email) throw new Error("SAML assertion missing email");

  // Check if user exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Ensure they're on this tenant
    const userRole = await db.userRole.findUnique({
      where: { userId_tenantId: { userId: existing.id, tenantId } },
    });
    if (!userRole && roleId) {
      await db.userRole.create({
        data: { userId: existing.id, tenantId, roleId, assignedBy: "sso-jit" },
      });
    }
    if (!existing.tenantId) {
      await db.user.update({ where: { id: existing.id }, data: { tenantId } });
    }
    return { userId: existing.id, isNew: false };
  }

  // Create new user (no password — they auth via SSO)
  const newUser = await db.user.create({
    data: {
      email,
      name: [attrs.firstName, attrs.lastName].filter(Boolean).join(" ") || email,
      passwordHash: "!sso-only!", // cannot login via password
      role: "user",
      tenantId,
    },
  });

  if (roleId) {
    await db.userRole.create({
      data: { userId: newUser.id, tenantId, roleId, assignedBy: "sso-jit" },
    });
  }

  return { userId: newUser.id, isNew: true };
}

/**
 * Decrypt an OIDC client secret stored in DB.
 */
export async function getOidcClientSecret(connId: string): Promise<string | null> {
  const conn = await db.ssoConnection.findUnique({ where: { id: connId } });
  if (!conn?.oidcClientSecretEnc) return null;
  return decryptField(conn.oidcClientSecretEnc);
}

/**
 * Encrypt an OIDC client secret for storage.
 */
export async function setOidcClientSecret(connId: string, secret: string): Promise<void> {
  const enc = await encryptField(secret);
  await db.ssoConnection.update({
    where: { id: connId },
    data: { oidcClientSecretEnc: enc },
  });
}
