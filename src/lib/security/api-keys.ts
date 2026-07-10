/**
 * API Key Authentication
 * ----------------------
 * Per-tenant API keys for programmatic access.
 * Format: "artha_live_<base62>" (40 chars total)
 * Stored: sha256 hash (look up by hash)
 *
 * Scopes: ["documents:read", "documents:write", "tax:read", "tax:compute",
 *          "portfolio:read", "portfolio:write", "audit:read", "exports:read",
 *          "bulk_jobs:write", "webhooks:manage"]
 */

import { db } from "../db";
import { createHash, randomBytes } from "crypto";
import { checkRateLimitAsync } from "../security";
import type { AuthContext } from "./rbac";

export interface ApiKeyAuthResult {
  valid: boolean;
  ctx?: AuthContext;
  apiKeyId?: string;
  tenantId?: string;
  error?: string;
}

const KEY_PREFIX = "artha_live_";

/**
 * Generate a new API key. Returns the raw key (only shown once) and the DB record.
 */
export async function generateApiKey(params: {
  tenantId: string;
  name: string;
  scopes: string[];
  rateLimitPerMin?: number;
  ipAllowlist?: string[];
  expiresInDays?: number;
  createdBy: string;
}): Promise<{ apiKey: string; record: any }> {
  // Generate random key
  const random = randomBytes(24).toString("base64url");
  const apiKey = KEY_PREFIX + random;

  const keyPrefix = apiKey.slice(0, 12);
  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const expiresAt = params.expiresInDays
    ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const record = await db.apiKey.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      keyPrefix,
      keyHash,
      scopesJson: JSON.stringify(params.scopes),
      rateLimitPerMin: params.rateLimitPerMin || 600,
      ipAllowlistJson: params.ipAllowlist ? JSON.stringify(params.ipAllowlist) : null,
      expiresAt,
      createdBy: params.createdBy,
    },
  });

  return { apiKey, record };
}

/**
 * Authenticate a request by API key.
 * Returns the auth context with API key scopes as permissions.
 */
export async function authenticateApiKey(
  apiKey: string,
  clientIp?: string
): Promise<ApiKeyAuthResult> {
  if (!apiKey.startsWith(KEY_PREFIX)) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const record = await db.apiKey.findUnique({
    where: { keyHash },
    include: { tenant: true },
  });

  if (!record) return { valid: false, error: "Invalid API key" };
  if (record.revokedAt) return { valid: false, error: "API key revoked" };
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { valid: false, error: "API key expired" };
  }
  if (record.tenant.status !== "active") {
    return { valid: false, error: "Tenant suspended" };
  }

  // IP allowlist check
  if (record.ipAllowlistJson && clientIp) {
    try {
      const allowlist: string[] = JSON.parse(record.ipAllowlistJson);
      if (allowlist.length > 0 && !allowlist.includes(clientIp)) {
        return { valid: false, error: "IP not allowed" };
      }
    } catch {}
  }

  // Rate limit (per key, per minute)
  const allowed = await checkRateLimitAsync(
    `apikey:${record.id}`,
    record.rateLimitPerMin,
    60_000
  );
  if (!allowed) {
    return { valid: false, error: "Rate limit exceeded", apiKeyId: record.id, tenantId: record.tenantId };
  }

  // Update lastUsedAt (throttled — only update every 60s)
  await db.apiKey.updateMany({
    where: { id: record.id, lastUsedAt: { lt: new Date(Date.now() - 60_000) } },
    data: { lastUsedAt: new Date() },
  });

  // Parse scopes into permissions
  let scopes: string[] = [];
  try { scopes = JSON.parse(record.scopesJson || "[]"); } catch {}

  const permissions = new Set(scopes);

  const ctx: AuthContext = {
    userId: `apikey:${record.id}`,
    tenantId: record.tenantId,
    actorType: "api_key",
    actorId: record.id,
    permissions,
    isPlatformAdmin: false,
    ipAddress: clientIp,
  };

  return { valid: true, ctx, apiKeyId: record.id, tenantId: record.tenantId };
}

/**
 * Revoke an API key.
 */
export async function revokeApiKey(apiKeyId: string, tenantId: string): Promise<void> {
  await db.apiKey.updateMany({
    where: { id: apiKeyId, tenantId },
    data: { revokedAt: new Date() },
  });
}

/**
 * List API keys for a tenant (without revealing the actual key).
 */
export async function listApiKeys(tenantId: string) {
  return db.apiKey.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopesJson: true,
      rateLimitPerMin: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      createdBy: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
