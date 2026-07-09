/**
 * Tests for entity tax engine + compliance calendar
 */

import { describe, it, expect } from "vitest";
import { computeEntityTax, compareRegimes, TAX_RATES } from "@/lib/entity/tax-engine";
import { ENTITY_TYPES, ENTITY_CATEGORIES, isIncomeTaxExempt } from "@/lib/entity/types";
import {
  getApplicableFilings,
  generateComplianceCalendar,
  getUpcomingFilings,
  getOverdueFilings,
} from "@/lib/entity/compliance-calendar";

describe("Entity Type System", () => {
  it("should have all 30 entity types defined", () => {
    expect(Object.keys(ENTITY_TYPES)).toHaveLength(30);
  });

  it("should have 7 entity categories", () => {
    expect(ENTITY_CATEGORIES).toHaveLength(7);
  });

  it("every category should reference valid entity types", () => {
    for (const cat of ENTITY_CATEGORIES) {
      for (const t of cat.types) {
        expect(ENTITY_TYPES[t]).toBeDefined();
        expect(ENTITY_TYPES[t].type).toBe(t);
      }
    }
  });

  it("should correctly identify exempt entities", () => {
    expect(isIncomeTaxExempt("government_dept")).toBe(true);
    expect(isIncomeTaxExempt("local_authority")).toBe(true);
    expect(isIncomeTaxExempt("private_limited")).toBe(false);
    expect(isIncomeTaxExempt("bank")).toBe(false);
  });

  it("Pvt Ltd should be in concessional regime by default", () => {
    expect(ENTITY_TYPES.private_limited.taxRegime).toBe("cit_new_115baa");
  });

  it("manufacturing_unit should be in §115BAB regime", () => {
    expect(ENTITY_TYPES.manufacturing_unit.taxRegime).toBe("cit_new_mfg_115bab");
  });

  it("LLP should be in flat 30% regime", () => {
    expect(ENTITY_TYPES.llp.taxRegime).toBe("llp_flat");
  });

  it("trust_ngo should be in 12AB regime", () => {
    expect(ENTITY_TYPES.trust_ngo.taxRegime).toBe("trust_12ab");
  });

  it("banks should have RBI as regulator", () => {
    expect(ENTITY_TYPES.bank.regulators).toContain("rbi");
  });

  it("insurance_company should have IRDAI as regulator", () => {
    expect(ENTITY_TYPES.insurance_company.regulators).toContain("irdai");
  });

  it("universities should have UGC as regulator", () => {
    expect(ENTITY_TYPES.university_govt.regulators).toContain("ugc");
    expect(ENTITY_TYPES.university_private.regulators).toContain("ugc");
  });
});

describe("Entity Tax Engine — CIT", () => {
  it("should compute §115BAA tax for Pvt Ltd (25.17% effective)", () => {
    const result = computeEntityTax({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 10000000, // ₹1 Cr
      deductions: { section80C: 150000, section80D: 25000 }, // ignored in concessional
    });
    // 22% on 1 Cr = 22,00,000; surcharge = 0 (income ≤ ₹1 Cr); cess = 4% = 88,000
    // Total = 22,88,000
    expect(result.baseTax).toBe(2200000);
    expect(result.cess).toBe(88000);
    expect(result.totalIncomeTax).toBe(2288000);
    expect(result.finalIncomeTax).toBe(2288000);
  });

  it("should apply 10% surcharge cap for §115BAA on income > ₹1 Cr", () => {
    const result = computeEntityTax({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 50000000, // ₹5 Cr
      deductions: {},
    });
    // 22% on 5 Cr = 1,10,00,000; surcharge = 10% = 11,00,000; cess = 4% on (1.1Cr + 11L) = 4,84,000
    // Total = 1,10,00,000 + 11,00,000 + 4,84,000 = 1,25,84,000
    expect(result.baseTax).toBe(11000000);
    expect(result.surcharge).toBe(1100000);
    expect(result.cess).toBe(484000);
    expect(result.totalIncomeTax).toBe(12584000);
  });

  it("should compute §115BAB tax for manufacturing (17.16% effective)", () => {
    const result = computeEntityTax({
      entityType: "manufacturing_unit",
      financialYear: "2024-25",
      grossIncome: 10000000,
      deductions: {},
    });
    // 15% on 1 Cr = 15,00,000; no surcharge (< ₹1 Cr); cess = 4% = 60,000
    // Total = 15,60,000
    expect(result.baseTax).toBe(1500000);
    expect(result.cess).toBe(60000);
    expect(result.totalIncomeTax).toBe(1560000);
  });

  it("should compute LLP flat 30% tax", () => {
    const result = computeEntityTax({
      entityType: "llp",
      financialYear: "2024-25",
      grossIncome: 10000000,
      deductions: {},
    });
    // 30% on 1 Cr = 30,00,000; no surcharge (< ₹1 Cr); cess = 4% = 1,20,000
    // Total = 31,20,000
    expect(result.baseTax).toBe(3000000);
    expect(result.cess).toBe(120000);
    expect(result.totalIncomeTax).toBe(3120000);
  });

  it("should apply 12% surcharge for LLP on income > ₹1 Cr", () => {
    const result = computeEntityTax({
      entityType: "llp",
      financialYear: "2024-25",
      grossIncome: 20000000, // ₹2 Cr
      deductions: {},
    });
    // 30% on 2 Cr = 60,00,000; surcharge = 12% = 7,20,000; cess = 4% on (60L + 7.2L) = 2,68,800
    // Total = 60,00,000 + 7,20,000 + 2,68,800 = 69,88,800
    expect(result.baseTax).toBe(6000000);
    expect(result.surcharge).toBe(720000);
    expect(result.cess).toBe(268800);
  });

  it("should return 0 income tax for exempt government dept", () => {
    const result = computeEntityTax({
      entityType: "government_dept",
      financialYear: "2024-25",
      grossIncome: 100000000,
      deductions: {},
    });
    expect(result.finalIncomeTax).toBe(0);
    expect(result.regime).toBe("exempt");
  });

  it("should return 0 income tax for trust_ngo (assumes 85% application)", () => {
    const result = computeEntityTax({
      entityType: "trust_ngo",
      financialYear: "2024-25",
      grossIncome: 5000000,
      deductions: {},
    });
    expect(result.baseTax).toBe(0);
    expect(result.finalIncomeTax).toBe(0);
  });
});

describe("Entity Tax Engine — GST + CSR + Other", () => {
  it("should compute GST net payable (output - ITC)", () => {
    const result = computeEntityTax({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 10000000,
      deductions: {},
      gst: {
        outputTax: 1800000,
        inputTaxCredit: 1200000,
        rcmLiability: 0,
      },
    });
    expect(result.gstPayable).toBe(1800000);
    expect(result.gstInputTaxCredit).toBe(1200000);
    expect(result.gstNetPayable).toBe(600000);
  });

  it("should compute CSR liability for eligible company", () => {
    const result = computeEntityTax({
      entityType: "public_limited", // CSR applicable
      financialYear: "2024-25",
      grossIncome: 100000000,
      deductions: {},
      avgNetProfit3yr: 20000000, // ₹2 Cr avg net profit → CSR = 2% = ₹4 L
    });
    expect(result.csrLiability).toBe(400000);
  });

  it("should not compute CSR for LLP", () => {
    const result = computeEntityTax({
      entityType: "llp",
      financialYear: "2024-25",
      grossIncome: 100000000,
      deductions: {},
      avgNetProfit3yr: 20000000,
    });
    expect(result.csrLiability).toBe(0);
  });

  it("should include professional tax for applicable entities", () => {
    const result = computeEntityTax({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 10000000,
      deductions: {},
    });
    expect(result.professionalTax).toBe(2500); // PT_ANNUAL_MAX
  });

  it("should compute total tax burden as sum of all taxes", () => {
    const result = computeEntityTax({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 10000000,
      deductions: {},
      gst: { outputTax: 1800000, inputTaxCredit: 1200000, rcmLiability: 0 },
      tdsDeducted: 500000,
      advanceTaxPaid: 800000,
      stampDutyPaid: 50000,
    });
    // total = income tax + gst + stamp duty + professional tax
    expect(result.totalTaxBurden).toBeGreaterThan(result.finalIncomeTax);
    expect(result.totalTaxBurden).toBeGreaterThan(result.gstNetPayable);
  });

  it("should generate recommendations for high effective tax rate", () => {
    const result = computeEntityTax({
      entityType: "llp",
      financialYear: "2024-25",
      grossIncome: 100000, // very low income — high effective rate due to PT
      deductions: {},
    });
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe("Entity Tax Engine — Regime Comparison", () => {
  it("should compare new vs default regime for Pvt Ltd", () => {
    const result = compareRegimes({
      entityType: "private_limited",
      financialYear: "2024-25",
      grossIncome: 20000000, // ₹2 Cr
      deductions: { section80C: 150000, section80D: 25000, depreciation: 500000 },
    });
    expect(result.newRegime.finalIncomeTax).toBeGreaterThan(0);
    expect(result.defaultRegime.finalIncomeTax).toBeGreaterThan(0);
    expect(["new", "default"]).toContain(result.recommendation);
  });
});

describe("Compliance Calendar", () => {
  it("should return applicable filings for Pvt Ltd", () => {
    const filings = getApplicableFilings("private_limited");
    expect(filings.length).toBeGreaterThan(5);
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).toContain("itr-6");
    expect(filingIds).toContain("gstr-1");
    expect(filingIds).toContain("gstr-3b");
    expect(filingIds).toContain("tds-deposit");
    expect(filingIds).toContain("mca-aoc4");
    expect(filingIds).toContain("mca-mgt7");
  });

  it("should include RBI returns for banks", () => {
    const filings = getApplicableFilings("bank");
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).toContain("rbi-returns");
  });

  it("should include IRDAI returns for insurance companies", () => {
    const filings = getApplicableFilings("insurance_company");
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).toContain("irdai-returns");
  });

  it("should include RERA returns for real estate developers", () => {
    const filings = getApplicableFilings("real_estate_developer");
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).toContain("rera-returns");
  });

  it("should include UGC returns for universities", () => {
    const filings = getApplicableFilings("university_govt");
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).toContain("ugc-returns");
  });

  it("should NOT include GST returns for schools (GST-exempt)", () => {
    const filings = getApplicableFilings("school");
    const filingIds = filings.map((f) => f.id);
    expect(filingIds).not.toContain("gstr-1");
    expect(filingIds).not.toContain("gstr-3b");
  });

  it("should generate a 12-month compliance calendar", () => {
    const calendar = generateComplianceCalendar("private_limited", new Date(), 12);
    expect(calendar.length).toBeGreaterThan(10);
    // Should have at least one entry per month for GSTR-3B
    const gstr3bEntries = calendar.filter((e) => e.filing.id === "gstr-3b");
    expect(gstr3bEntries.length).toBeGreaterThanOrEqual(10);
  });

  it("should classify entries as overdue/due-soon/upcoming/scheduled", () => {
    const calendar = generateComplianceCalendar("private_limited", new Date(), 3);
    const validStatuses = ["overdue", "due-soon", "upcoming", "scheduled"];
    for (const entry of calendar) {
      expect(validStatuses).toContain(entry.status);
    }
  });

  it("should return upcoming filings sorted by due date", () => {
    const upcoming = getUpcomingFilings("private_limited", 5);
    expect(upcoming.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < upcoming.length; i++) {
      expect(upcoming[i].dueDate.getTime()).toBeGreaterThanOrEqual(upcoming[i - 1].dueDate.getTime());
    }
  });

  it("every filing should have a non-empty penalty description", () => {
    const filings = getApplicableFilings("bank");
    for (const f of filings) {
      expect(f.penalty).toBeTruthy();
      expect(f.form).toBeTruthy();
      expect(f.statutoryBody).toBeTruthy();
    }
  });
});

describe("Tax Rate Constants", () => {
  it("should have §115BAA rate at 22%", () => {
    expect(TAX_RATES.CIT_NEW_115BAA).toBe(0.22);
  });

  it("should have §115BAB rate at 15%", () => {
    expect(TAX_RATES.CIT_NEW_MFG_115BAB).toBe(0.15);
  });

  it("should have LLP flat rate at 30%", () => {
    expect(TAX_RATES.LLP_FLAT).toBe(0.30);
  });

  it("should have health & education cess at 4%", () => {
    expect(TAX_RATES.HEALTH_EDUCATION_CESS).toBe(0.04);
  });

  it("should have GST e-commerce TCS at 0.5%", () => {
    expect(TAX_RATES.GST_TCS_ECOM).toBe(0.005);
  });

  it("should have CSR rate at 2%", () => {
    expect(TAX_RATES.CSR_RATE).toBe(0.02);
  });
});
