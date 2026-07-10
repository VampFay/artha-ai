/**
 * Tests for security modules (bank-grade features)
 */

import { describe, it, expect } from "vitest";
import {
  encryptField,
  decryptField,
  isEncrypted,
  maskPii,
  detectPiiCategory,
} from "@/lib/security/field-encryption";
import { hashRequestBody } from "@/lib/security/audit-chain";
import {
  anonymizeForAnalytics,
  redactPii,
  generalize,
  hashPii,
  autoClassify,
} from "@/lib/compliance/data-classification";
import {
  validateProcessingAllowed,
  canTransferData,
  RESIDENCY_POLICIES,
} from "@/lib/compliance/data-residency";

describe("Field Encryption", () => {
  it("should encrypt and decrypt a value round-trip", async () => {
    const plaintext = "ABCDE1234F"; // PAN-like
    const encrypted = await encryptField(plaintext);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(plaintext);
    expect(isEncrypted(encrypted!)).toBe(true);

    const decrypted = await decryptField(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should handle null/undefined input", async () => {
    expect(await encryptField(null)).toBeNull();
    expect(await encryptField(undefined)).toBeNull();
    expect(await encryptField("")).toBeNull();
    expect(await decryptField(null)).toBeNull();
  });

  it("should be idempotent (encrypting encrypted value returns same)", async () => {
    const plaintext = "test@example.com";
    const encrypted = await encryptField(plaintext);
    const reEncrypted = await encryptField(encrypted);
    expect(reEncrypted).toBe(encrypted);
  });

  it("should produce different ciphertexts for same plaintext (random IV)", async () => {
    const plaintext = "123456789012";
    const enc1 = await encryptField(plaintext);
    const enc2 = await encryptField(plaintext);
    expect(enc1).not.toBe(enc2);
  });
});

describe("PII Masking", () => {
  it("should mask PAN correctly", () => {
    // 10-char PAN with 4 visible at start, 2 at end = "ABCD" + 4 masks + "4F"
    expect(maskPii("ABCDE1234F", 4, 2)).toBe("ABCD****4F");
  });

  it("should mask short values entirely", () => {
    expect(maskPii("ABC", 4, 2)).toBe("***");
  });
});

describe("PII Detection", () => {
  it("should detect PAN", () => {
    expect(detectPiiCategory("ABCDE1234F")).toBe("pan");
  });

  it("should detect Aadhaar", () => {
    expect(detectPiiCategory("123456789012")).toBe("aadhaar");
  });

  it("should detect IFSC", () => {
    expect(detectPiiCategory("HDFC0001234")).toBe("ifsc");
  });

  it("should detect GSTIN", () => {
    expect(detectPiiCategory("27ABCDE1234F1Z5")).toBe("gstin");
  });

  it("should detect email", () => {
    expect(detectPiiCategory("test@example.com")).toBe("email");
  });

  it("should detect phone (India)", () => {
    expect(detectPiiCategory("+919876543210")).toBe("phone");
  });

  it("should detect credit card (passes Luhn)", () => {
    // 4111111111111111 is a known Luhn-valid test card
    expect(detectPiiCategory("4111111111111111")).toBe("credit_card");
  });

  it("should return null for non-PII", () => {
    expect(detectPiiCategory("hello world")).toBeNull();
    expect(detectPiiCategory("")).toBeNull();
  });
});

describe("Audit Chain Hashing", () => {
  it("should hash request bodies deterministically", () => {
    const body = { a: 1, b: 2 };
    const hash1 = hashRequestBody(body);
    const hash2 = hashRequestBody(body);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce different hashes for different bodies", () => {
    const hash1 = hashRequestBody({ a: 1 });
    const hash2 = hashRequestBody({ a: 2 });
    expect(hash1).not.toBe(hash2);
  });

  it("should handle null input", () => {
    expect(hashRequestBody(null)).toBeNull();
  });
});

describe("PII Redaction", () => {
  it("should redact PAN", () => {
    const text = "My PAN is ABCDE1234F please use it carefully";
    const redacted = redactPii(text);
    expect(redacted).toContain("[REDACTED_PAN]");
    expect(redacted).not.toContain("ABCDE1234F");
  });

  it("should redact email", () => {
    const text = "Contact test@example.com for details";
    const redacted = redactPii(text);
    expect(redacted).toContain("[REDACTED_EMAIL]");
  });

  it("should redact Aadhaar", () => {
    const text = "Aadhaar: 1234 5678 9012";
    const redacted = redactPii(text);
    expect(redacted).toContain("[REDACTED_AADHAAR]");
  });

  it("should redact IFSC", () => {
    const text = "IFSC HDFC0001234 for transfer";
    const redacted = redactPii(text);
    expect(redacted).toContain("[REDACTED_IFSC]");
  });
});

describe("Data Anonymization", () => {
  it("should hash emails for analytics", () => {
    const record = { email: "test@example.com", name: "Test User" };
    const anonymized = anonymizeForAnalytics(record);
    expect(anonymized.email).not.toBe("test@example.com");
    expect(anonymized.email).toMatch(/^[a-f0-9]{16}$/);
    expect(anonymized.name).not.toBe("Test User");
  });

  it("should hash PAN, Aadhaar, card numbers", () => {
    const record = {
      pan: "ABCDE1234F",
      aadhaar: "123456789012",
      card: "4111111111111111",
    };
    const anonymized = anonymizeForAnalytics(record);
    expect(anonymized.pan).not.toBe("ABCDE1234F");
    expect(anonymized.aadhaar).not.toBe("123456789012");
    expect(anonymized.card).not.toBe("4111111111111111");
  });

  it("should keep last 4 of account numbers", () => {
    const record = { account: "1234567890" };
    const anonymized = anonymizeForAnalytics(record);
    expect(anonymized.account).toBe("****7890");
  });

  it("should keep first 4 chars of IFSC (bank code)", () => {
    const record = { ifsc: "HDFC0001234" };
    const anonymized = anonymizeForAnalytics(record);
    expect(anonymized.ifsc).toBe("HDFC");
  });
});

describe("Generalization", () => {
  it("should generalize age into brackets", () => {
    const dob = "1990-01-01";
    const bracket = generalize(dob, "age");
    expect(bracket).toMatch(/^\d{2}-\d{2}$/);
  });

  it("should generalize amounts into ranges", () => {
    expect(generalize(500, "amount")).toBe("0-1000");
    expect(generalize(5000, "amount")).toBe("1000-10000");
    expect(generalize(75000, "amount")).toBe("50000-100000");
    expect(generalize(2000000, "amount")).toBe("1000000+");
  });

  it("should generalize pincodes (keep first 3)", () => {
    expect(generalize("400001", "pincode")).toBe("400XXX");
  });
});

describe("Data Residency", () => {
  it("should allow processing in ap-south-1 for financial_analysis", () => {
    const result = validateProcessingAllowed("ap-south-1", "financial_analysis");
    expect(result.allowed).toBe(true);
  });

  it("should reject processing in EU for unsupported type", () => {
    const result = validateProcessingAllowed("eu-west-1", "ai_training");
    expect(result.allowed).toBe(false);
  });

  it("should allow cross-border transfer from EU to US", () => {
    const result = canTransferData("eu-west-1", "us-east-1");
    expect(result.allowed).toBe(true);
  });

  it("should reject cross-border transfer from India (data localization)", () => {
    const result = canTransferData("ap-south-1", "us-east-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("localization");
  });

  it("should allow same-region transfers", () => {
    const result = canTransferData("ap-south-1", "ap-south-1");
    expect(result.allowed).toBe(true);
  });

  it("should have correct retention years for India", () => {
    expect(RESIDENCY_POLICIES["ap-south-1"].retentionYears).toBe(7);
    expect(RESIDENCY_POLICIES["ap-south-1"].dataLocalizationMandatory).toBe(true);
  });
});

describe("Auto-Classification", () => {
  it("should classify PAN as restricted", () => {
    const result = autoClassify("ABCDE1234F");
    expect(result.classification).toBe("restricted");
    expect(result.piiCategory).toBe("pan");
  });

  it("should classify email as confidential", () => {
    const result = autoClassify("test@example.com");
    expect(result.classification).toBe("confidential");
    expect(result.piiCategory).toBe("email");
  });

  it("should classify non-PII as internal", () => {
    const result = autoClassify("hello world");
    expect(result.classification).toBe("internal");
  });
});
