/**
 * Hash-Chained Audit Log
 * ----------------------
 * Append-only audit trail with cryptographic non-repudiation.
 * Each entry's hash incorporates the previous entry's hash, forming a chain.
 * Tampering with any entry breaks the chain and is detectable.
 *
 * Storage: AuditChainEntry table.
 * Verification: walk the chain from genesis, recompute hashes, detect breaks.
 *
 * Used for: SOC 2 CC7 (audit controls), GDPR Art. 30, RBI audit requirements.
 */

import { db } from "../db";
import { createHash } from "crypto";
import { getKmsProvider, getDefaultKeyId } from "./kms";

export interface AuditEntryInput {
  tenantId?: string | null;
  userId?: string | null;
  actorType?: "user" | "api_key" | "system" | "sso";
  actorId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestBody?: any | null; // for request hashing
}

export interface ChainVerificationResult {
  valid: boolean;
  totalEntries: number;
  brokenAt: number | null; // index of first broken entry
  brokenEntryId?: string;
  verifiedAt: Date;
}

/**
 * Compute the canonical hash of an audit entry.
 * Hash = SHA256(prevHash + "|" + canonical(entry fields))
 */
function computeEntryHash(
  prevHash: string | null,
  entry: {
    tenantId: string | null;
    userId: string | null;
    actorType: string;
    actorId: string | null;
    action: string;
    resourceType: string | null;
    resourceId: string | null;
    detailsJson: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    requestHash: string | null;
    timestamp: Date;
  }
): string {
  // Canonical ordering — fields MUST be in this exact order for reproducibility
  const canonical = [
    prevHash || "",
    entry.tenantId || "",
    entry.userId || "",
    entry.actorType,
    entry.actorId || "",
    entry.action,
    entry.resourceType || "",
    entry.resourceId || "",
    entry.detailsJson || "",
    entry.ipAddress || "",
    entry.userAgent || "",
    entry.requestHash || "",
    entry.timestamp.toISOString(),
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Hash a request body for non-repudiation.
 * Only used for state-changing requests (POST/PUT/DELETE).
 */
export function hashRequestBody(body: any): string | null {
  if (body === null || body === undefined) return null;
  try {
    // Stable serialization — sort keys
    const stable = JSON.stringify(body, Object.keys(body).sort());
    return createHash("sha256").update(stable).digest("hex");
  } catch {
    return null;
  }
}

/**
 * Append a new entry to the audit chain.
 * Fetches the latest entry's hash for the tenant (or global if no tenant),
 * computes the new hash, and writes atomically.
 */
export async function appendAuditEntry(input: AuditEntryInput): Promise<string> {
  // 1. Get the previous hash for this chain
  //    Chains are per-tenant. If no tenant, use a global chain.
  const prevEntry = await db.auditChainEntry.findFirst({
    where: input.tenantId ? { tenantId: input.tenantId } : { tenantId: null },
    orderBy: { timestamp: "desc" },
    select: { entryHash: true },
  });
  const prevHash = prevEntry?.entryHash || null;

  // 2. Prepare the entry
  const timestamp = new Date();
  const detailsJson = input.details ? JSON.stringify(input.details) : null;
  const requestHash = input.requestBody ? hashRequestBody(input.requestBody) : null;

  const entryFields = {
    tenantId: input.tenantId || null,
    userId: input.userId || null,
    actorType: input.actorType || "user",
    actorId: input.actorId || null,
    action: input.action,
    resourceType: input.resourceType || null,
    resourceId: input.resourceId || null,
    detailsJson,
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null,
    requestHash,
    timestamp,
  };

  // 3. Compute the hash
  const entryHash = computeEntryHash(prevHash, entryFields);

  // 4. Write to DB
  const created = await db.auditChainEntry.create({
    data: {
      ...entryFields,
      prevHash,
      entryHash,
    },
    select: { id: true },
  });

  return created.id;
}

/**
 * Verify the integrity of an audit chain.
 * Walks from the first entry, recomputes each hash, detects tampering.
 */
export async function verifyAuditChain(
  tenantId?: string | null,
  limit = 10000
): Promise<ChainVerificationResult> {
  const where = tenantId !== undefined ? { tenantId } : {};
  const entries = await db.auditChainEntry.findMany({
    where,
    orderBy: { timestamp: "asc" },
    take: limit,
    select: {
      id: true,
      tenantId: true,
      userId: true,
      actorType: true,
      actorId: true,
      action: true,
      resourceType: true,
      resourceId: true,
      detailsJson: true,
      ipAddress: true,
      userAgent: true,
      requestHash: true,
      prevHash: true,
      entryHash: true,
      timestamp: true,
    },
  });

  let prevHash: string | null = null;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    // Check prevHash linkage
    if (e.prevHash !== prevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAt: i,
        brokenEntryId: e.id,
        verifiedAt: new Date(),
      };
    }
    // Recompute hash
    const recomputed = computeEntryHash(prevHash, e);
    if (recomputed !== e.entryHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAt: i,
        brokenEntryId: e.id,
        verifiedAt: new Date(),
      };
    }
    prevHash = e.entryHash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    brokenAt: null,
    verifiedAt: new Date(),
  };
}

/**
 * Sign the latest entry's hash with KMS — periodic anchor for long-term chains.
 * This creates a tamper-evident checkpoint even if the DB is compromised later.
 */
export async function anchorChainHead(tenantId?: string | null): Promise<{
  entryHash: string;
  signature: string;
  signedAt: Date;
}> {
  const latest = await db.auditChainEntry.findFirst({
    where: tenantId !== undefined ? { tenantId } : {},
    orderBy: { timestamp: "desc" },
    select: { entryHash: true, timestamp: true },
  });

  if (!latest) {
    throw new Error("No entries to anchor");
  }

  const kms = getKmsProvider();
  const keyId = getDefaultKeyId();
  const signature = await kms.sign(keyId, Buffer.from(latest.entryHash, "hex"));

  return {
    entryHash: latest.entryHash,
    signature: signature.toString("base64"),
    signedAt: new Date(),
  };
}
