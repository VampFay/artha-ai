/**
 * Field-Level Encryption
 * ----------------------
 * Encrypts sensitive PII fields (PAN, Aadhaar, account numbers, IFSC) at rest
 * using AES-256-GCM with envelope encryption via the KMS provider.
 *
 * Storage format: JSON-serialized EncryptedPayload, stored in DB as TEXT.
 * Detection prefix: "enc:v1:" — so we can detect already-encrypted values.
 *
 * PII categories handled:
 *   - PAN (Permanent Account Number) — 10 char alphanumeric
 *   - Aadhaar — 12 digit UID
 *   - Bank account number — 9-18 digits
 *   - IFSC — 11 char alphanumeric
 *   - Credit card number — 13-19 digits
 *   - GSTIN — 15 char alphanumeric
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getKmsProvider, getDefaultKeyId, type EncryptedPayload } from "./kms";

const ENCRYPTED_PREFIX = "enc:v1:";
const KEY_VERSION = 1;

/** Detect if a value is already encrypted */
export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Encrypt a plaintext string. Returns "enc:v1:<base64-json-payload>".
 * Returns null for null/empty input.
 */
export async function encryptField(
  plaintext: string | null | undefined,
  keyId?: string
): Promise<string | null> {
  if (plaintext === null || plaintext === undefined || plaintext === "") return null;
  if (isEncrypted(plaintext)) return plaintext; // idempotent

  const kms = getKmsProvider();
  const useKeyId = keyId || getDefaultKeyId();

  // 1. Generate DEK
  const { plaintext: dek, wrapped: wrappedDek } = await kms.generateDataKey(useKeyId);

  // 2. Encrypt with AES-256-GCM
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", dek, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // 3. Zeroize plaintext DEK (best effort in JS — V8 GC)
  dek.fill(0);

  // 4. Build payload
  const payload: EncryptedPayload = {
    keyId: useKeyId,
    wrappedDek: wrappedDek.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    keyVersion: KEY_VERSION,
    alg: "AES-256-GCM",
  };

  return ENCRYPTED_PREFIX + Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Decrypt an encrypted field. Returns null for null/empty input.
 * Throws if the value is not a valid encrypted payload.
 */
export async function decryptField(encrypted: string | null | undefined): Promise<string | null> {
  if (encrypted === null || encrypted === undefined || encrypted === "") return null;
  if (!isEncrypted(encrypted)) return encrypted; // not encrypted — return as-is

  const payloadB64 = encrypted.slice(ENCRYPTED_PREFIX.length);
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
  } catch {
    throw new Error("Invalid encrypted payload");
  }

  if (payload.alg !== "AES-256-GCM") {
    throw new Error(`Unsupported algorithm: ${payload.alg}`);
  }

  const kms = getKmsProvider();
  const wrappedDek = Buffer.from(payload.wrappedDek, "base64");

  // 1. Unwrap DEK via KMS
  const dek = await kms.unwrapDataKey(wrappedDek);

  // 2. Decrypt with AES-256-GCM
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = createDecipheriv("aes-256-gcm", dek, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");

  // Zeroize DEK
  dek.fill(0);

  return plaintext;
}

/**
 * Mask a sensitive value for display (e.g., "XXXX1234A" -> "XXXX***4A")
 */
export function maskPii(value: string | null | undefined, visibleStart = 4, visibleEnd = 2): string {
  if (!value) return "";
  if (value.length <= visibleStart + visibleEnd) return "*".repeat(value.length);
  const start = value.slice(0, visibleStart);
  const end = value.slice(-visibleEnd);
  const maskLen = Math.min(8, value.length - visibleStart - visibleEnd);
  return `${start}${"*".repeat(maskLen)}${end}`;
}

/**
 * Detect PII category from a value (for tagging/classification).
 */
export function detectPiiCategory(value: string): string | null {
  if (!value) return null;
  const v = value.replace(/\s/g, "");

  // PAN: 5 letters, 4 digits, 1 letter
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v)) return "pan";

  // Aadhaar: 12 digits (with optional spaces)
  if (/^[0-9]{12}$/.test(v)) return "aadhaar";

  // IFSC: 4 letters + 0 + 6 alphanumeric
  if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) return "ifsc";

  // GSTIN: 15 chars
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/.test(v)) return "gstin";

  // Credit card: 13-19 digits, passes Luhn
  if (/^[0-9]{13,19}$/.test(v) && luhnCheck(v)) return "credit_card";

  // Bank account: 9-18 digits
  if (/^[0-9]{9,18}$/.test(v)) return "account_number";

  // Email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";

  // Phone (India)
  if (/^\+?91?[0-9]{10}$/.test(v)) return "phone";

  return null;
}

function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
