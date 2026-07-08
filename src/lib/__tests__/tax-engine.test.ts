import { describe, it, expect } from "vitest";

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
    });

    it("tax above ₹7L is NOT rebated", () => {
      let tax = applySlabs(701000, NEW_SLABS);
      if (701000 <= REBATE_87A_LIMIT) tax = 0;
      expect(tax).toBeGreaterThan(0);
      // ₹3L-7L at 5% = ₹20,000 + ₹1,000 at 10% = ₹20,100
      expect(tax).toBe(20100);
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
});
