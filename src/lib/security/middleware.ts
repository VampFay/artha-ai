/**
 * Unified Auth Middleware
 * -----------------------
 * Authenticates requests via one of:
 *   1. Bearer JWT (user sessions)
 *   2. X-API-Key header (programmatic API access)
 *   3. SSO session cookie (SAML/OIDC after ACS)
 *
 * Returns an AuthContext with userId, tenantId, permissions.
 * Used by all /api/v1/* enterprise endpoints.
 */

import type { NextRequest } from "next/server";
import { db } from "../db";
import { verifyToken } from "../auth";
import { authenticateApiKey } from "./api-keys";
import { loadUserPermissions, requirePermission, hasPermission, RbacError, type AuthContext, type Resource, type Action } from "./rbac";
import { getClientIp } from "../security";

// Re-export for convenience
export { requirePermission, hasPermission, RbacError };
export type { Resource, Action };

export interface AuthResult {
  authenticated: boolean;
  ctx?: AuthContext;
  error?: string;
}

/**
 * Authenticate a Next.js API request.
 * Tries API key first (for programmatic), then Bearer JWT (for user sessions).
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  const clientIp = getClientIp(req);

  // 1. Try API key
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const result = await authenticateApiKey(apiKey, clientIp);
    if (result.valid && result.ctx) {
      return { authenticated: true, ctx: result.ctx };
    }
    return { authenticated: false, error: result.error || "Invalid API key" };
  }

  // 2. Try Bearer JWT
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) {
      return { authenticated: false, error: "Invalid or expired token" };
    }

    // Load user + tenant + permissions
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tenantId: true, role: true },
    });
    if (!user) return { authenticated: false, error: "User not found" };

    const { permissions, roleName, roleId } = await loadUserPermissions(user.id, user.tenantId);

    const ctx: AuthContext = {
      userId: user.id,
      tenantId: user.tenantId,
      roleId,
      roleName,
      permissions,
      isPlatformAdmin: user.role === "admin",
      actorType: "user",
      actorId: user.id,
      ipAddress: clientIp,
      userAgent: req.headers.get("user-agent") || undefined,
    };

    return { authenticated: true, ctx };
  }

  return { authenticated: false, error: "No credentials provided" };
}

/**
 * Require authentication — returns ctx or throws a 401-formatted error.
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const result = await authenticateRequest(req);
  if (!result.authenticated || !result.ctx) {
    throw new AuthError(result.error || "Authentication required", 401);
  }
  return result.ctx;
}

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Convert any auth/RBAC error to a Next.js Response.
 */
export function errorResponse(err: any): Response {
  const status = err.statusCode || 500;
  const code = err.code || "internal_error";
  return Response.json(
    {
      error: {
        code,
        message: err.message || "Internal server error",
      },
    },
    { status }
  );
}
