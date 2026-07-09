/**
 * SCIM 2.0 Server
 * ----------------
 * Implements the SCIM 2.0 protocol (RFC 7643, 7644) for automated user
 * provisioning from corporate IdPs (Azure AD, Okta, OneLogin).
 *
 * Endpoints:
 *   GET    /api/scim/v2/Users           — list/search users
 *   POST   /api/scim/v2/Users           — create user
 *   GET    /api/scim/v2/Users/:id       — get user
 *   PUT    /api/scim/v2/Users/:id       — replace user
 *   PATCH  /api/scim/v2/Users/:id       — patch user
 *   DELETE /api/scim/v2/Users/:id       — deactivate user
 *   GET    /api/scim/v2/Groups          — list groups
 *   POST   /api/scim/v2/Groups          — create group
 *   GET    /api/scim/v2/Groups/:id      — get group
 *
 * Auth: Bearer token (per-tenant SCIM token stored encrypted in SsoConnection.scimTokenEnc)
 *
 * Tenant routing: identified by the SCIM token's tenant association.
 */

import { db } from "../db";
import { decryptField, encryptField } from "./field-encryption";
import { hashPassword } from "../auth";
import { assignRole } from "./rbac";

export interface ScimUser {
  schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"];
  id: string;
  externalId?: string;
  userName: string;
  name?: { givenName?: string; familyName?: string };
  displayName?: string;
  emails: { value: string; type: string; primary: boolean }[];
  active: boolean;
  groups?: { value: string; display: string }[];
  meta: { resourceType: "User"; created: string; lastModified: string; location: string };
}

export interface ScimListResponse<T> {
  schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

/**
 * Authenticate a SCIM request via Bearer token.
 * Returns the tenantId the token belongs to, or null.
 */
export async function authenticateScimRequest(
  bearerToken: string
): Promise<{ tenantId: string; ssoConnectionId: string } | null> {
  // Hash the token and look it up
  const crypto = require("crypto") as typeof import("crypto");
  const tokenHash = crypto.createHash("sha256").update(bearerToken).digest("hex");

  // We can't directly query by tokenHash since SCIM tokens are encrypted.
  // Instead, iterate active SSO connections and try to match.
  // Production: store tokenHash alongside the encrypted token for fast lookup.
  const connections = await db.ssoConnection.findMany({
    where: { scimTokenEnc: { not: null }, isActive: true },
    include: { tenant: true },
  });

  for (const conn of connections) {
    if (!conn.scimTokenEnc) continue;
    const storedToken = await decryptField(conn.scimTokenEnc);
    if (storedToken === bearerToken) {
      return { tenantId: conn.tenantId, ssoConnectionId: conn.id };
    }
  }

  return null;
}

/**
 * Convert internal User to SCIM 2.0 User representation.
 */
function toScimUser(user: any, baseUrl: string): ScimUser {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: user.id,
    externalId: user.id, // map to our ID
    userName: user.email,
    name: {
      givenName: user.name?.split(" ")[0],
      familyName: user.name?.split(" ").slice(1).join(" "),
    },
    displayName: user.name,
    emails: [{ value: user.email, type: "work", primary: true }],
    active: !user.passwordHash.startsWith("!deactivated!"),
    meta: {
      resourceType: "User",
      created: user.createdAt.toISOString(),
      lastModified: user.updatedAt.toISOString(),
      location: `${baseUrl}/Users/${user.id}`,
    },
  };
}

/**
 * List users for a tenant (with SCIM filtering — basic support).
 */
export async function scimListUsers(
  tenantId: string,
  params: { startIndex?: number; count?: number; filter?: string },
  baseUrl: string
): Promise<ScimListResponse<ScimUser>> {
  const startIndex = params.startIndex || 1;
  const count = Math.min(params.count || 100, 500);

  // Very basic filter: userName eq "x" or emails.value eq "x"
  let where: any = { tenantId };
  if (params.filter) {
    const m = params.filter.match(/(\w+(?:\.\w+)?)\s+eq\s+"([^"]+)"/);
    if (m) {
      const [, field, value] = m;
      if (field === "userName" || field === "emails.value") {
        where.email = value;
      }
    }
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: startIndex - 1,
      take: count,
      orderBy: { createdAt: "asc" },
    }),
    db.user.count({ where }),
  ]);

  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: total,
    startIndex,
    itemsPerPage: users.length,
    Resources: users.map((u) => toScimUser(u, baseUrl)),
  };
}

/**
 * Create a user via SCIM.
 */
export async function scimCreateUser(
  tenantId: string,
  scimUser: Partial<ScimUser>,
  baseUrl: string
): Promise<ScimUser> {
  const email = scimUser.emails?.[0]?.value;
  if (!email) throw new ScimError("Missing email", 400, "invalid_syntax");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new ScimError(`User ${email} already exists`, 409, "uniqueness");
  }

  // Generate a random initial password (user must reset via SSO)
  const tempPassword = require("crypto").randomBytes(24).toString("base64");
  const passwordHash = await hashPassword(tempPassword);

  const user = await db.user.create({
    data: {
      email,
      name: scimUser.displayName || scimUser.name?.givenName || email,
      passwordHash: scimUser.active === false ? "!deactivated!" : passwordHash,
      role: "user",
      tenantId,
    },
  });

  // Assign default viewer role
  await assignRole(user.id, tenantId, "viewer", "scim-provisioning").catch(() => {});

  return toScimUser(user, baseUrl);
}

/**
 * Get a single user via SCIM.
 */
export async function scimGetUser(
  tenantId: string,
  userId: string,
  baseUrl: string
): Promise<ScimUser> {
  const user = await db.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) throw new ScimError("User not found", 404, "not_found");
  return toScimUser(user, baseUrl);
}

/**
 * Update (replace) a user via SCIM PUT.
 */
export async function scimUpdateUser(
  tenantId: string,
  userId: string,
  scimUser: Partial<ScimUser>,
  baseUrl: string
): Promise<ScimUser> {
  const existing = await db.user.findFirst({ where: { id: userId, tenantId } });
  if (!existing) throw new ScimError("User not found", 404, "not_found");

  const email = scimUser.emails?.[0]?.value || existing.email;
  await db.user.update({
    where: { id: userId },
    data: {
      email,
      name: scimUser.displayName || existing.name,
      passwordHash: scimUser.active === false ? "!deactivated!" : existing.passwordHash,
    },
  });

  const updated = await db.user.findUnique({ where: { id: userId } });
  return toScimUser(updated, baseUrl);
}

/**
 * Patch a user via SCIM PATCH.
 */
export async function scimPatchUser(
  tenantId: string,
  userId: string,
  patch: { Operations: Array<{ op: string; path?: string; value: any }> },
  baseUrl: string
): Promise<ScimUser> {
  const existing = await db.user.findFirst({ where: { id: userId, tenantId } });
  if (!existing) throw new ScimError("User not found", 404, "not_found");

  for (const op of patch.Operations) {
    if (op.op.toLowerCase() === "replace") {
      if (op.path === "userName" || op.path === "emails[type eq \"work\"].value") {
        await db.user.update({ where: { id: userId }, data: { email: op.value } });
      } else if (op.path === "displayName") {
        await db.user.update({ where: { id: userId }, data: { name: op.value } });
      } else if (op.path === "active") {
        // Deactivate by prefixing password hash
        if (op.value === false) {
          await db.user.update({
            where: { id: userId },
            data: { passwordHash: "!deactivated!" + existing.passwordHash },
          });
        } else {
          // Reactivate — strip the prefix
          if (existing.passwordHash.startsWith("!deactivated!")) {
            await db.user.update({
              where: { id: userId },
              data: { passwordHash: existing.passwordHash.slice("!deactivated!".length) },
            });
          }
        }
      }
    }
  }

  const updated = await db.user.findUnique({ where: { id: userId } });
  return toScimUser(updated, baseUrl);
}

/**
 * Delete (deactivate) a user via SCIM.
 */
export async function scimDeleteUser(tenantId: string, userId: string): Promise<void> {
  const existing = await db.user.findFirst({ where: { id: userId, tenantId } });
  if (!existing) throw new ScimError("User not found", 404, "not_found");

  // Revoke all refresh tokens + mark inactive
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: "!deactivated!" + existing.passwordHash },
  });
}

export class ScimError extends Error {
  status: number;
  scimType: string;
  constructor(message: string, status: number, scimType: string) {
    super(message);
    this.status = status;
    this.scimType = scimType;
  }

  toScimError() {
    return {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: this.message,
      status: this.status.toString(),
      scimType: this.scimType,
    };
  }
}
