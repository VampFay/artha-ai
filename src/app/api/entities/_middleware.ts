/**
 * Entity API middleware helpers — rate limiting + audit logging.
 * Applied to all /api/entities/* routes for security + compliance.
 */

import type { NextRequest } from "next/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/security";
import { appendAuditEntry } from "@/lib/security/audit-chain";
import type { AuthContext } from "@/lib/security/rbac";

/**
 * Apply rate limiting to entity API requests.
 * Limit: 100 requests per minute per user.
 * Returns null if allowed, or a Response object if rate-limited.
 */
export async function checkEntityRateLimit(
  req: NextRequest,
  ctx: AuthContext
): Promise<Response | null> {
  const ip = getClientIp(req);
  const key = `entity_api:${ctx.userId}:${ip}`;
  const allowed = await checkRateLimitAsync(key, 100, 60_000);
  if (!allowed) {
    return Response.json(
      { error: { code: "rate_limited", message: "Too many requests. Please slow down." } },
      { status: 429 }
    );
  }
  return null;
}

/**
 * Log entity API access to the audit chain.
 */
export async function logEntityAccess(
  ctx: AuthContext,
  action: string,
  entityId?: string,
  details?: Record<string, any>
): Promise<void> {
  await appendAuditEntry({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    actorType: ctx.actorType,
    actorId: ctx.actorId,
    action: `entity.api.${action}`,
    resourceType: entityId ? "entity" : undefined,
    resourceId: entityId,
    details,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  }).catch(() => {}); // Non-blocking — audit failures shouldn't break the request
}
