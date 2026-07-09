/**
 * PDF Digital Signing
 * -------------------
 * Digitally signs PDF reports using a KMS-backed signing key.
 * For bank-grade deployments, the signing key lives in an HSM (FIPS 140-2 Level 3).
 *
 * Flow:
 *   1. Generate a detached SHA-256 hash of the PDF bytes.
 *   2. Sign the hash with the KMS key (RSASSA-PKCS1-v1_5 or RSASSA-PSS).
 *   3. Embed the signature + cert chain in the PDF as a PKCS#7 signature.
 *   4. Verify the signature on retrieval.
 *
 * For local dev, falls back to HMAC-SHA256 with a master key.
 */

import { createHash } from "crypto";
import { getKmsProvider, getDefaultKeyId } from "./kms";

export interface PdfSignature {
  /** KMS key ID used to sign */
  keyId: string;
  /** Algorithm */
  alg: "RSASSA-PKCS1-v1_5-SHA-256" | "HMAC-SHA256";
  /** Signature bytes (base64) */
  signature: string;
  /** Hash that was signed (base64) */
  signedHash: string;
  /** ISO timestamp */
  signedAt: string;
  /** Signer identity (tenant + user or system) */
  signedBy: string;
  /** Public certificate (PEM) for verification — null in dev */
  publicCert: string | null;
}

/**
 * Sign a PDF buffer.
 */
export async function signPdf(
  pdfBytes: Buffer,
  signedBy: string,
  keyId?: string
): Promise<PdfSignature> {
  const kms = getKmsProvider();
  const useKeyId = keyId || getDefaultKeyId();

  // 1. Compute SHA-256 hash of the PDF
  const hash = createHash("sha256").update(pdfBytes).digest();

  // 2. Sign the hash via KMS
  const signature = await kms.sign(useKeyId, hash);

  // 3. Determine algorithm
  const alg = useKeyId.startsWith("local-")
    ? "HMAC-SHA256"
    : "RSASSA-PKCS1-v1_5-SHA-256";

  return {
    keyId: useKeyId,
    alg,
    signature: signature.toString("base64"),
    signedHash: hash.toString("base64"),
    signedAt: new Date().toISOString(),
    signedBy,
    publicCert: process.env.PDF_SIGNING_CERT_PEM || null,
  };
}

/**
 * Verify a PDF signature.
 */
export async function verifyPdfSignature(
  pdfBytes: Buffer,
  sig: PdfSignature
): Promise<boolean> {
  const kms = getKmsProvider();

  // 1. Recompute hash
  const hash = createHash("sha256").update(pdfBytes).digest();
  const expectedHashB64 = hash.toString("base64");
  if (expectedHashB64 !== sig.signedHash) {
    return false; // PDF was modified after signing
  }

  // 2. Verify signature
  const signatureBytes = Buffer.from(sig.signature, "base64");
  return kms.verify(sig.keyId, hash, signatureBytes);
}
