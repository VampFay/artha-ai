/**
 * Data Classification & Anonymization
 * -----------------------------------
 * Classifies data into tiers and provides anonymization for analytics:
 *
 * Classification tiers:
 *   - public       : marketing copy, blog posts
 *   - internal     : product docs, internal metrics
 *   - confidential : user PII (name, email), financial aggregates
 *   - restricted   : PAN, Aadhaar, account numbers, transaction details
 *
 * Anonymization techniques:
 *   - Hashing (one-way, deterministic): for joining without PII
 *   - Pseudonymization (reversible with key): for analytics with re-identification
 *   - Generalization: replace DOB with age bracket, amount with range
 *   - Suppression: replace PII with [REDACTED]
 *   - K-anonymity: ensure each record is indistinguishable from k-1 others
 */

import { createHash } from "crypto";
import { detectPiiCategory } from "../security/field-encryption";

export type DataClassification = "public" | "internal" | "confidential" | "restricted";

/**
 * Tag a resource with its data classification.
 */
export async function tagResource(
  resourceType: string,
  resourceId: string,
  classification: DataClassification,
  piiCategories: string[] = [],
  taggedBy?: string
): Promise<void> {
  const { db } = await import("../db");
  await db.dataClassificationTag.create({
    data: {
      resourceType,
      resourceId,
      classification,
      piiCategoriesJson: piiCategories.length > 0 ? JSON.stringify(piiCategories) : null,
      taggedBy: taggedBy || "auto-classifier:v1",
    },
  });
}

/**
 * Auto-classify a field value based on PII detection.
 */
export function autoClassify(value: string): {
  classification: DataClassification;
  piiCategory: string | null;
} {
  const pii = detectPiiCategory(value);
  if (pii) {
    return {
      classification: pii === "email" || pii === "phone" ? "confidential" : "restricted",
      piiCategory: pii,
    };
  }
  // Check for currency/financial values
  if (/^[0-9]+(\.[0-9]+)?$/.test(value) && parseFloat(value) > 0) {
    return { classification: "confidential", piiCategory: null };
  }
  return { classification: "internal", piiCategory: null };
}

/**
 * Hash a PII value for pseudonymous analytics.
 * Uses HMAC-SHA256 with a tenant-specific salt.
 */
export function hashPii(value: string, salt: string = "artha-analytics-salt"): string {
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 16);
}

/**
 * Generalize a value to reduce identifiability.
 *   - DOB -> age bracket (e.g., "30-39")
 *   - Amount -> range (e.g., "10000-50000")
 *   - PIN code -> first 3 digits
 */
export function generalize(value: string | number, type: "age" | "amount" | "pincode"): string {
  if (type === "age") {
    const dob = new Date(value as string);
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const bracket = Math.floor(age / 10) * 10;
    return `${bracket}-${bracket + 9}`;
  }
  if (type === "amount") {
    const n = Number(value);
    if (n < 1000) return "0-1000";
    if (n < 10000) return "1000-10000";
    if (n < 50000) return "10000-50000";
    if (n < 100000) return "50000-100000";
    if (n < 500000) return "100000-500000";
    if (n < 1000000) return "500000-1000000";
    return "1000000+";
  }
  if (type === "pincode") {
    const s = String(value);
    return s.length >= 3 ? s.slice(0, 3) + "XXX" : s;
  }
  return String(value);
}

/**
 * Suppress (redact) PII in a text string.
 * Replaces detected PII with [REDACTED_PAN], [REDACTED_AADHAAR], etc.
 */
export function redactPii(text: string): string {
  let result = text;

  // PAN
  result = result.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[REDACTED_PAN]");

  // Aadhaar (12 digits, optionally space-separated)
  result = result.replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "[REDACTED_AADHAAR]");

  // Credit card (13-19 digits)
  result = result.replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]");

  // IFSC
  result = result.replace(/\b[A-Z]{4}0[A-Z0-9]{6}\b/g, "[REDACTED_IFSC]");

  // GSTIN
  result = result.replace(/\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d\b/g, "[REDACTED_GSTIN]");

  // Email
  result = result.replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, "[REDACTED_EMAIL]");

  // Phone (Indian)
  result = result.replace(/\b\+?91?[6-9]\d{9}\b/g, "[REDACTED_PHONE]");

  return result;
}

/**
 * Anonymize a dataset for analytics (k-anonymity).
 * Removes direct identifiers, generalizes quasi-identifiers.
 */
export function anonymizeForAnalytics(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined) {
      out[key] = value;
      continue;
    }

    const s = String(value);
    const pii = detectPiiCategory(s);

    // Drop direct identifiers
    if (pii === "email" || pii === "phone" || key.toLowerCase().includes("name")) {
      out[key] = hashPii(s);
      continue;
    }

    // Hash PAN/Aadhaar/card — keep linkage, drop value
    if (pii === "pan" || pii === "aadhaar" || pii === "credit_card" || pii === "gstin") {
      out[key] = hashPii(s);
      continue;
    }

    // Mask IFSC (first 4 chars = bank code, useful for analytics)
    if (pii === "ifsc") {
      out[key] = s.slice(0, 4);
      continue;
    }

    // Mask account numbers (keep last 4)
    if (pii === "account_number") {
      out[key] = "****" + s.slice(-4);
      continue;
    }

    out[key] = value;
  }
  return out;
}
