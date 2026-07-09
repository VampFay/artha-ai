/**
 * RBAC (Role-Based Access Control)
 * -------------------------------
 * Permission model:
 *   Resource  × Action = Permission
 *   Role ⊃ set of Permissions
 *   User → UserRole (tenant-scoped) → Role → Permissions
 *
 * Resources: documents, tax, portfolio, users, audit, settings, consents,
 *            api_keys, webhooks, sso, retention, billing, exports, bulk_jobs
 *
 * Actions:   read, write, delete, export, admin
 *
 * System roles (created on tenant provisioning):
 *   - tenant_admin: full access within tenant
 *   - compliance_officer: read-only audit + consent management
 *   - analyst: read/write financial data, no user management
 *   - auditor: read-only everything within tenant
 *   - viewer: read-only documents and reports
 */

import { db } from "../db";

export type Resource =
  | "documents"
  | "tax"
  | "portfolio"
  | "users"
  | "audit"
  | "settings"
  | "consents"
  | "api_keys"
  | "webhooks"
  | "sso"
  | "retention"
  | "billing"
  | "exports"
  | "bulk_jobs"
  | "data_subject_requests";

export type Action = "read" | "write" | "delete" | "export" | "admin";

export interface Permission {
  resource: Resource;
  action: Action;
}

export interface AuthContext {
  userId: string;
  tenantId: string | null;
  roleId?: string | null;
  roleName?: string | null;
  permissions?: Set<string>;
  isPlatformAdmin?: boolean;
  actorType: "user" | "api_key" | "system" | "sso";
  actorId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Permission key format: "resource:action"
 */
function permKey(r: Resource, a: Action): string {
  return `${r}:${a}`;
}

/**
 * System role definitions — seeded on tenant creation.
 */
export const SYSTEM_ROLES: Record<string, { description: string; permissions: Permission[] }> = {
  tenant_admin: {
    description: "Full administrative access within tenant",
    permissions: [
      { resource: "documents", action: "admin" },
      { resource: "tax", action: "admin" },
      { resource: "portfolio", action: "admin" },
      { resource: "users", action: "admin" },
      { resource: "audit", action: "read" },
      { resource: "settings", action: "admin" },
      { resource: "consents", action: "admin" },
      { resource: "api_keys", action: "admin" },
      { resource: "webhooks", action: "admin" },
      { resource: "sso", action: "admin" },
      { resource: "retention", action: "admin" },
      { resource: "billing", action: "admin" },
      { resource: "exports", action: "admin" },
      { resource: "bulk_jobs", action: "admin" },
      { resource: "data_subject_requests", action: "admin" },
    ],
  },
  compliance_officer: {
    description: "Audit and consent management (read + admin on consents/DSR)",
    permissions: [
      { resource: "audit", action: "read" },
      { resource: "audit", action: "export" },
      { resource: "consents", action: "admin" },
      { resource: "data_subject_requests", action: "admin" },
      { resource: "retention", action: "admin" },
      { resource: "documents", action: "read" },
    ],
  },
  analyst: {
    description: "Read/write financial data, no user management",
    permissions: [
      { resource: "documents", action: "read" },
      { resource: "documents", action: "write" },
      { resource: "documents", action: "delete" },
      { resource: "tax", action: "read" },
      { resource: "tax", action: "write" },
      { resource: "portfolio", action: "read" },
      { resource: "portfolio", action: "write" },
      { resource: "exports", action: "read" },
      { resource: "bulk_jobs", action: "write" },
      { resource: "bulk_jobs", action: "read" },
    ],
  },
  auditor: {
    description: "Read-only access to all tenant data",
    permissions: [
      { resource: "documents", action: "read" },
      { resource: "tax", action: "read" },
      { resource: "portfolio", action: "read" },
      { resource: "users", action: "read" },
      { resource: "audit", action: "read" },
      { resource: "audit", action: "export" },
      { resource: "settings", action: "read" },
      { resource: "consents", action: "read" },
      { resource: "bulk_jobs", action: "read" },
    ],
  },
  viewer: {
    description: "Read-only documents and reports",
    permissions: [
      { resource: "documents", action: "read" },
      { resource: "tax", action: "read" },
      { resource: "portfolio", action: "read" },
    ],
  },
};

/**
 * Load a user's permissions for a tenant.
 * Returns a Set of "resource:action" strings.
 */
export async function loadUserPermissions(
  userId: string,
  tenantId: string | null
): Promise<{ permissions: Set<string>; roleName: string | null; roleId: string | null }> {
  // Platform admin (legacy "admin" role) — has all permissions
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return { permissions: new Set(), roleName: null, roleId: null };
  if (user.role === "admin") {
    const all = new Set<string>();
    for (const def of Object.values(SYSTEM_ROLES)) {
      for (const p of def.permissions) all.add(permKey(p.resource, p.action));
    }
    return { permissions: all, roleName: "platform_admin", roleId: null };
  }

  // No tenant — minimal permissions (personal user)
  if (!tenantId) {
    const personal = new Set<string>([
      "documents:read", "documents:write", "documents:delete",
      "tax:read", "tax:write",
      "portfolio:read", "portfolio:write",
      "audit:read", "consents:read", "consents:write",
      "exports:read", "settings:read", "settings:write",
    ]);
    return { permissions: personal, roleName: "personal", roleId: null };
  }

  // Tenant-scoped role
  const userRole = await db.userRole.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!userRole) {
    return { permissions: new Set(), roleName: null, roleId: null };
  }

  const perms = new Set<string>();
  for (const rp of userRole.role.permissions) {
    perms.add(permKey(rp.permission.resource as Resource, rp.permission.action as Action));
  }

  return { permissions: perms, roleName: userRole.role.name, roleId: userRole.role.id };
}

/**
 * Check if a context has a specific permission.
 */
export function hasPermission(ctx: AuthContext, resource: Resource, action: Action): boolean {
  if (ctx.isPlatformAdmin) return true;
  if (!ctx.permissions) return false;
  return ctx.permissions.has(permKey(resource, action));
}

/**
 * Require a permission — throws 403 if missing.
 */
export function requirePermission(ctx: AuthContext, resource: Resource, action: Action): void {
  if (!hasPermission(ctx, resource, action)) {
    throw new RbacError(
      `Insufficient permissions: requires ${resource}:${action}`,
      403,
      "FORBIDDEN"
    );
  }
}

export class RbacError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Seed system roles and permissions for a new tenant.
 */
export async function seedTenantRoles(tenantId: string): Promise<void> {
  // 1. Create permissions if they don't exist
  const allPerms: Permission[] = [];
  for (const def of Object.values(SYSTEM_ROLES)) {
    for (const p of def.permissions) {
      if (!allPerms.some((x) => x.resource === p.resource && x.action === p.action)) {
        allPerms.push(p);
      }
    }
  }

  for (const p of allPerms) {
    await db.permission.upsert({
      where: { resource_action: { resource: p.resource, action: p.action } },
      update: {},
      create: { resource: p.resource, action: p.action },
    });
  }

  // 2. Create system roles for the tenant
  for (const [name, def] of Object.entries(SYSTEM_ROLES)) {
    const role = await db.role.upsert({
      where: { tenantId_name: { tenantId, name } },
      update: { description: def.description },
      create: {
        tenantId,
        name,
        description: def.description,
        isSystem: true,
      },
    });

    // Link permissions
    for (const p of def.permissions) {
      const perm = await db.permission.findUnique({
        where: { resource_action: { resource: p.resource, action: p.action } },
      });
      if (perm) {
        await db.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
}

/**
 * Assign a system role to a user for a tenant.
 */
export async function assignRole(
  userId: string,
  tenantId: string,
  roleName: string,
  assignedBy?: string
): Promise<void> {
  const role = await db.role.findUnique({
    where: { tenantId_name: { tenantId, name: roleName } },
  });
  if (!role) throw new Error(`Role not found: ${roleName}`);

  await db.userRole.upsert({
    where: { userId_tenantId: { userId, tenantId } },
    update: { roleId: role.id },
    create: { userId, tenantId, roleId: role.id, assignedBy },
  });

  // Update user.tenantId if they didn't have one
  await db.user.updateMany({
    where: { id: userId, tenantId: null },
    data: { tenantId },
  });
}
