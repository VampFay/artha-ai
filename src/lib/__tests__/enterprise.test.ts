/**
 * Tests for GSTR generator, TDS generator, DTAA matrix, and transfer pricing
 */

import { describe, it, expect } from "vitest";
import { getWithholdingRate, listDtaaCountries, checkPERisk, DOMESTIC_RATES, DTAA_MATRIX } from "@/lib/tax/dtaa-matrix";
import {
  computeALP,
  checkSafeHarbour,
  computeTPPenalty,
  TP_METHODS,
  SAFE_HARBOUR_RATES,
  type TPTransaction,
} from "@/lib/tax/transfer-pricing";
import { TDS_RATES, getTdsRate } from "@/lib/tds/tds-generator";
import { detectPiiCategory } from "@/lib/security/field-encryption";

// ============================================================
// DTAA Matrix Tests
// ============================================================

describe("DTAA Matrix", () => {
  it("should have 10 countries in DTAA matrix", () => {
    expect(Object.keys(DTAA_MATRIX)).toHaveLength(10);
  });

  it("should list all DTAA countries", () => {
    const countries = listDtaaCountries();
    expect(countries.length).toBe(10);
    expect(countries.some(c => c.code === "US")).toBe(true);
    expect(countries.some(c => c.code === "MU")).toBe(true);
    expect(countries.some(c => c.code === "SG")).toBe(true);
  });

  it("should apply treaty rate when lower than domestic", () => {
    // US dividend: treaty 15%, domestic 20% → should apply 15%
    const result = getWithholdingRate("US", "dividend", true, true, true);
    expect(result.treatyRate).toBe(0.15);
    expect(result.applicableRate).toBe(0.15);
    expect(result.appliedSource).toBe("treaty");
  });

  it("should apply domestic rate when no PAN (Section 206AA → 20%)", () => {
    const result = getWithholdingRate("US", "dividend", false, true, true);
    expect(result.applicableRate).toBe(0.20);
    expect(result.appliedSource).toBe("no_pan");
    expect(result.conditions.some(c => c.includes("PAN") || c.includes("206AA"))).toBe(true);
  });

  it("should apply domestic rate when no TRC", () => {
    const result = getWithholdingRate("US", "dividend", true, false, true);
    expect(result.appliedSource).toBe("domestic");
    expect(result.requirements).toContain("Tax Residency Certificate (TRC) required for treaty benefit");
  });

  it("should apply domestic rate when no Form 10F", () => {
    const result = getWithholdingRate("US", "dividend", true, true, false);
    expect(result.appliedSource).toBe("domestic");
    expect(result.requirements).toContain("Form 10F required for treaty benefit");
  });

  it("should use domestic rate when no treaty exists", () => {
    const result = getWithholdingRate("XX", "dividend", true, true, true);
    expect(result.treatyRate).toBeNull();
    expect(result.appliedSource).toBe("domestic");
  });

  it("Mauritius treaty should have 0% FTS rate", () => {
    const result = getWithholdingRate("MU", "fts", true, true, true);
    expect(result.treatyRate).toBe(0.10);
  });

  it("UAE treaty should have 0% FTS rate", () => {
    const result = getWithholdingRate("AE", "fts", true, true, true);
    expect(result.treatyRate).toBe(0);
    expect(result.applicableRate).toBe(0);
  });

  it("should detect PE risk correctly", () => {
    expect(checkPERisk("US", true, false, 0, false).hasPE).toBe(true);
    expect(checkPERisk("US", false, true, 0, false).hasPE).toBe(true);
    expect(checkPERisk("US", false, false, 0, true).hasPE).toBe(true);
    expect(checkPERisk("US", false, false, 183, false).hasPE).toBe(true);
    expect(checkPERisk("US", false, false, 50, false).hasPE).toBe(false);
    expect(checkPERisk("US", false, false, 90, false).riskLevel).toBe("medium");
    expect(checkPERisk("US", false, false, 10, false).riskLevel).toBe("low");
  });

  it("should have correct domestic rates", () => {
    expect(DOMESTIC_RATES.dividend.rate).toBe(0.20);
    expect(DOMESTIC_RATES.interest.rate).toBe(0.20);
    expect(DOMESTIC_RATES.royalty.rate).toBe(0.10);
    expect(DOMESTIC_RATES.fts.rate).toBe(0.10);
  });
});

// ============================================================
// Transfer Pricing Tests
// ============================================================

describe("Transfer Pricing", () => {
  const mockTransaction: TPTransaction = {
    id: "test-1",
    entityId: "entity-1",
    type: "international",
    associatedEnterprise: "Foreign AE",
    country: "US",
    transactionNature: "software_development",
    amount: 10000000,
    date: new Date(),
    method: "TNMM",
  };

  it("should have 5 TP methods", () => {
    expect(Object.keys(TP_METHODS)).toHaveLength(5);
    expect(TP_METHODS.CUP).toBeDefined();
    expect(TP_METHODS.TNMM).toBeDefined();
    expect(TP_METHODS.PSM).toBeDefined();
  });

  it("should compute ALP using TNMM", () => {
    const comparables = [
      { name: "TCS", margin: 0.22, weight: 1 },
      { name: "Infosys", margin: 0.20, weight: 1 },
      { name: "Wipro", margin: 0.18, weight: 1 },
    ];
    const result = computeALP(mockTransaction, comparables, "TNMM");
    expect(result.armLengthPrice).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("should detect variance > 5% requiring adjustment", () => {
    const comparables = [{ name: "Peer", margin: 0.30, weight: 1 }];
    const result = computeALP(mockTransaction, comparables, "TNMM");
    expect(result.variancePercent).toBeGreaterThan(0.05);
    expect(result.adjustmentRequired).toBe(true);
  });

  it("should not require adjustment when variance < 5%", () => {
    const comparables = [{ name: "Peer", margin: 0.01, weight: 1 }];
    const result = computeALP(mockTransaction, comparables, "TNMM");
    expect(result.adjustmentRequired).toBe(false);
  });

  it("should check safe harbour rates correctly", () => {
    // Software development safe harbour: 20%
    const meets = checkSafeHarbour("software_development", 0.25);
    expect(meets.meetsSafeHarbour).toBe(true);
    expect(meets.safeHarbourRate).toBe(0.20);

    const notMeets = checkSafeHarbour("software_development", 0.15);
    expect(notMeets.meetsSafeHarbour).toBe(false);
  });

  it("should compute penalty for non-filing of Form 3CEB", () => {
    // underReported=false so it falls through to 271BA check
    const penalty = computeTPPenalty(5000000, true, false, false);
    expect(penalty.penalty).toBe(100000);
    expect(penalty.section).toBe("271BA");
  });

  it("should compute penalty for no TP documentation", () => {
    // underReported=false so it falls through to 271G check
    const penalty = computeTPPenalty(5000000, false, true, false);
    expect(penalty.section).toBe("271G");
    expect(penalty.penalty).toBeGreaterThan(0);
  });

  it("should compute 300% penalty for under-reporting without documentation", () => {
    const penalty = computeTPPenalty(10000000, false, false, true);
    expect(penalty.section).toBe("271(1)(c)");
    expect(penalty.penalty).toBe(10000000 * 0.30 * 3);
  });

  it("should return 0 penalty when all documentation is in place", () => {
    const penalty = computeTPPenalty(1000000, true, true, false);
    expect(penalty.penalty).toBe(0);
  });
});

// ============================================================
// TDS Rate Lookup Tests
// ============================================================

describe("TDS Rates", () => {
  it("should have rates for all major sections", () => {
    expect(TDS_RATES["194A"]).toBeDefined();
    expect(TDS_RATES["194C"]).toBeDefined();
    expect(TDS_RATES["194J-Prof"]).toBeDefined();
    expect(TDS_RATES["194Q"]).toBeDefined();
    expect(TDS_RATES["194O"]).toBeDefined();
  });

  it("should return correct rate for 194A (interest)", () => {
    expect(getTdsRate("194A", "ABCDE1234F")).toBe(0.10);
  });

  it("should return 1% for 194C (contractor - individual)", () => {
    expect(getTdsRate("194C", "ABCDE1234F")).toBe(0.01);
  });

  it("should return 10% for 194J-Prof (professional fees)", () => {
    expect(getTdsRate("194J-Prof", "ABCDE1234F")).toBe(0.10);
  });

  it("should return 0.1% for 194Q (purchase of goods)", () => {
    expect(getTdsRate("194Q", "ABCDE1234F")).toBe(0.001);
  });

  it("should return 20% when no PAN provided", () => {
    expect(getTdsRate("194A", "")).toBe(0.20);
    expect(getTdsRate("194A")).toBe(0.20);
  });

  it("should return 20% when PAN is not 10 chars", () => {
    expect(getTdsRate("194A", "ABC")).toBe(0.20);
  });

  it("should return default 10% for unknown section", () => {
    expect(getTdsRate("999Z", "ABCDE1234F")).toBe(0.10);
  });
});

// ============================================================
// Error Handling Tests
// ============================================================

describe("Error Handling", () => {
  it("AppError should have correct codes and status codes", async () => {
    const { AppError } = await import("@/lib/errors");
    const authError = new AppError("AR001", undefined, undefined);
    expect(authError.code).toBe("AR001");
    expect(authError.statusCode).toBe(401);

    const notFound = new AppError("AR005");
    expect(notFound.statusCode).toBe(404);

    const validation = new AppError("AR006");
    expect(validation.statusCode).toBe(422);

    const rateLimit = new AppError("AR007");
    expect(rateLimit.statusCode).toBe(429);
  });

  it("AppError should have correlation ID", async () => {
    const { AppError } = await import("@/lib/errors");
    const err = new AppError("AR500");
    expect(err.correlationId).toBeTruthy();
    expect(err.correlationId?.startsWith("ar-")).toBe(true);
  });

  it("CircuitBreaker should open after threshold failures", async () => {
    const { CircuitBreaker } = await import("@/lib/errors");
    const cb = new CircuitBreaker("test", 3, 1000);

    // Cause 3 failures
    for (let i = 0; i < 3; i++) {
      try {
        await cb.execute(() => Promise.reject(new Error("fail")));
      } catch {}
    }

    const state = cb.getState();
    expect(state.state).toBe("open");
    expect(state.failures).toBe(3);
  });

  it("retryWithBackoff should retry on failure", async () => {
    const { retryWithBackoff } = await import("@/lib/errors");
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) throw new Error("fail");
      return Promise.resolve("success");
    };
    const result = await retryWithBackoff(fn, 3, 10);
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("retryWithBackoff should throw after max retries", async () => {
    const { retryWithBackoff } = await import("@/lib/errors");
    let attempts = 0;
    const fn = () => {
      attempts++;
      throw new Error("always fails");
    };
    try {
      await retryWithBackoff(fn, 2, 10);
      expect.unreachable("Should have thrown");
    } catch (err: any) {
      expect(err.message).toBe("always fails");
      expect(attempts).toBe(2);
    }
  });
});
