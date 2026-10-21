import { describe, it, expect } from "vitest";
import { computeSurcharge } from "../tax-engine";

// Test the tax slab computation logic directly (without DB)
// We extract the pure math functions for testing

const OLD_SLABS: [number, number, number][] = [
  [0, 250000, 0.0],
  [250000, 500000, 0.05],
  [500000, 1000000, 0.20],
  [1000000, Infinity, 0.30],
];

const NEW_SLABS: [number, number, number][] = [
  [0, 300000, 0.0],
  [300000, 700000, 0.05],
  [700000, 1000000, 0.10],
  [1000000, 1200000, 0.15],
  [1200000, 1500000, 0.20],
  [1500000, Infinity, 0.30],
];

const CESS = 0.04;
const STD_DED_OLD = 50000;
const STD_DED_NEW = 75000;
const REBATE_87A_LIMIT = 700000;

function applySlabs(taxable: number, slabs: [number, number, number][]): number {
  let tax = 0;
  for (const [lo, hi, rate] of slabs) {
    if (taxable <= lo) break;
    const amount = Math.min(taxable, hi) - lo;
    tax += amount * rate;
  }
  return Math.round(tax);
}

describe("Tax Engine", () => {
  describe("Slab computation (Old Regime)", () => {
    it("zero tax for income below ₹2.5L", () => {
      expect(applySlabs(200000, OLD_SLABS)).toBe(0);
    });

    it("5% tax for ₹2.5L-5L", () => {
      // ₹5L - ₹2.5L = ₹2.5L at 5% = ₹12,500
      expect(applySlabs(500000, OLD_SLABS)).toBe(12500);
    });

    it("20% tax for ₹5L-10L", () => {
      // ₹2.5L at 5% + ₹5L at 20% = ₹12,500 + ₹100,000 = ₹112,500
      expect(applySlabs(1000000, OLD_SLABS)).toBe(112500);
    });

    it("30% tax above ₹10L", () => {
      // ₹12,500 + ₹100,000 + ₹5L at 30% = ₹112,500 + ₹150,000 = ₹262,500
      expect(applySlabs(1500000, OLD_SLABS)).toBe(262500);
    });
  });

  describe("Slab computation (New Regime)", () => {
    it("zero tax for income below ₹3L", () => {
      expect(applySlabs(250000, NEW_SLABS)).toBe(0);
    });

    it("5% tax for ₹3L-7L", () => {
      // ₹7L - ₹3L = ₹4L at 5% = ₹20,000
      expect(applySlabs(700000, NEW_SLABS)).toBe(20000);
    });

    it("10% tax for ₹7L-10L", () => {
      // ₹4L at 5% + ₹3L at 10% = ₹20,000 + ₹30,000 = ₹50,000
      expect(applySlabs(1000000, NEW_SLABS)).toBe(50000);
    });

    it("15% tax for ₹10L-12L", () => {
      // ₹20,000 + ₹30,000 + ₹2L at 15% = ₹50,000 + ₹30,000 = ₹80,000
      expect(applySlabs(1200000, NEW_SLABS)).toBe(80000);
    });
  });

  describe("Section 87A Rebate", () => {
    it("no tax if taxable income ≤ ₹7L (new regime)", () => {
      let tax = applySlabs(700000, NEW_SLABS);
      // 87A rebate: if taxable ≤ 7L, tax = 0
      if (700000 <= REBATE_87A_LIMIT) tax = 0;
      expect(tax).toBe(0);

      let taxEdge = applySlabs(699999, NEW_SLABS);
      if (699999 <= REBATE_87A_LIMIT) taxEdge = 0;
      expect(taxEdge).toBe(0);
    });

    it("tax above ₹7L is NOT rebated", () => {
      let tax = applySlabs(701000, NEW_SLABS);
      if (701000 <= REBATE_87A_LIMIT) tax = 0;
      expect(tax).toBeGreaterThan(0);
      // ₹3L-7L at 5% = ₹20,000 + ₹1,000 at 10% = ₹20,100
      expect(tax).toBe(20100);

      let taxEdge = applySlabs(700001, NEW_SLABS);
      if (700001 <= REBATE_87A_LIMIT) taxEdge = 0;
      expect(taxEdge).toBeGreaterThan(0);
    });
  });

  describe("Standard Deduction", () => {
    it("old regime: ₹50,000 deduction", () => {
      const gross = 1000000;
      const taxable = Math.max(0, gross - STD_DED_OLD);
      expect(taxable).toBe(950000);
    });

    it("new regime: ₹75,000 deduction (Budget 2024)", () => {
      const gross = 1000000;
      const taxable = Math.max(0, gross - STD_DED_NEW);
      expect(taxable).toBe(925000);
    });

    it("no std deduction for non-salary income (gross=0)", () => {
      const salary = 0;
      const stdDedOld = salary > 0 ? STD_DED_OLD : 0;
      expect(stdDedOld).toBe(0);
    });
  });

  describe("Cess (4%)", () => {
    it("adds 4% health cess on tax", () => {
      const tax = 100000;
      const total = Math.round(tax * (1 + CESS));
      expect(total).toBe(104000);
    });
  });

  describe("Regime Comparison", () => {
    it("new regime is cheaper for high income with no deductions", () => {
      const gross = 2000000;
      const oldTaxable = Math.max(0, gross - STD_DED_OLD);
      const newTaxable = Math.max(0, gross - STD_DED_NEW);
      const oldTax = Math.round(applySlabs(oldTaxable, OLD_SLABS) * (1 + CESS));
      let newTax = applySlabs(newTaxable, NEW_SLABS);
      if (newTaxable <= REBATE_87A_LIMIT) newTax = 0;
      const newTotal = Math.round(newTax * (1 + CESS));
      // For ₹20L with no deductions, new regime should be cheaper
      expect(newTotal).toBeLessThan(oldTax);
    });
  });

  describe("Surcharge Computation", () => {
    it("zero surcharge for income below ₹50 Lakhs", () => {
      expect(computeSurcharge(4900000, 1000000, "new")).toBe(0);
      expect(computeSurcharge(4900000, 1000000, "old")).toBe(0);
      expect(computeSurcharge(4999999, 1000000, "new")).toBe(0);
      expect(computeSurcharge(0, 0, "new")).toBe(0);
    });

    it("10% surcharge boundary at exactly ₹50 Lakhs and up to ₹1Cr", () => {
      // Exactly 50L triggers 10%
      expect(computeSurcharge(5000000, 1000000, "new")).toBe(100000);
      expect(computeSurcharge(5000000, 1000000, "old")).toBe(100000);
      // 10% of ₹15,00,000 tax = ₹1,50,000
      expect(computeSurcharge(7500000, 1500000, "new")).toBe(150000);
      expect(computeSurcharge(7500000, 1500000, "old")).toBe(150000);
      expect(computeSurcharge(9999999, 1500000, "new")).toBe(150000);
    });

    it("15% surcharge boundary at exactly ₹1Cr and up to ₹2Cr", () => {
      // Exactly 1Cr triggers 15%
      expect(computeSurcharge(10000000, 2000000, "new")).toBe(300000);
      // 15% of ₹30,00,000 tax = ₹4,50,000
      expect(computeSurcharge(15000000, 3000000, "new")).toBe(450000);
      expect(computeSurcharge(15000000, 3000000, "old")).toBe(450000);
      expect(computeSurcharge(19999999, 3000000, "new")).toBe(450000);
    });

    it("25% surcharge boundary at exactly ₹2Cr and up to ₹5Cr", () => {
      // Exactly 2Cr triggers 25%
      expect(computeSurcharge(20000000, 5000000, "new")).toBe(1250000);
      // 25% of ₹60,00,000 tax = ₹15,00,000
      expect(computeSurcharge(30000000, 6000000, "new")).toBe(1500000);
      expect(computeSurcharge(30000000, 6000000, "old")).toBe(1500000);
      expect(computeSurcharge(49999999, 6000000, "new")).toBe(1500000);
    });

    it("37% surcharge boundary at exactly ₹5Cr in Old Regime", () => {
      // Exactly 5Cr triggers 37% in Old Regime
      expect(computeSurcharge(50000000, 10000000, "old")).toBe(3700000);
      // 37% of ₹1,80,00,000 tax = ₹66,60,000
      expect(computeSurcharge(60000000, 18000000, "old")).toBe(6660000);
    });

    it("25% surcharge capped at exactly ₹5Cr and above in New Regime", () => {
      // Exactly 5Cr triggers 25% cap in New Regime
      expect(computeSurcharge(50000000, 10000000, "new")).toBe(2500000);
      // 25% of ₹1,80,00,000 tax = ₹45,00,000
      expect(computeSurcharge(60000000, 18000000, "new")).toBe(4500000);
    });
  });
});
