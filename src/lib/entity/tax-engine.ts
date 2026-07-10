/**
 * Entity Tax Engine
 * -----------------
 * Computes tax liability for any institution type using the rule graph
 * defined in research/business-portal/BUSINESS_PORTAL_RESEARCH.md §4.1-4.2.
 *
 * Supports 14+ tax types:
 *   - CIT (new §115BAA 25.17%, new mfg §115BAB 17.16%, default 30%)
 *   - MAT (§115JB 17.47%)
 *   - LLP/Firm flat 30%
 *   - Trust/Co-op/HUF/Proprietorship regimes
 *   - GST (CGST/SGST/IGST with ITC netting)
 *   - TDS (sections 192-194S)
 *   - TCS (section 206C)
 *   - Surcharge + Health & Education Cess (4%)
 *   - CSR (2% of net profit, if applicable)
 *   - Equalisation Levy (legacy, phasing out)
 *   - STT/CTT (for listed/broker entities)
 *   - Stamp Duty (real estate/securities)
 *   - Professional Tax (state slab)
 *   - Customs Duty (importers)
 */

import { EntityType, getEntityTypeDef, isIncomeTaxExempt } from "./types";

// ============================================================
// Tax rate constants (FY 2024-25 / AY 2025-26)
// ============================================================

export const TAX_RATES = {
  // Corporate Income Tax
  CIT_NEW_115BAA: 0.22,        // + 10% surcharge cap + 4% cess = 25.17%
  CIT_NEW_MFG_115BAB: 0.15,    // + 10% surcharge cap + 4% cess = 17.16%
  CIT_DEFAULT: 0.30,           // + 7-15% surcharge + 4% cess
  MAT: 0.15,                   // + 10% surcharge + 4% cess = 17.47%

  // Non-corporate
  LLP_FLAT: 0.30,              // + 12% surcharge (>₹1Cr) + 4% cess
  COOP_SLAB_LOW: 0.10,         // for co-op income up to ₹10,000
  COOP_SLAB_MID: 0.20,
  COOP_SLAB_HIGH: 0.30,

  // Individual (proprietorship/HUF) — new regime slabs FY 2024-25
  PROP_NEW_REGIME_SLABS: [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 },
  ],

  // Trust — 85% application rule (effectively 0% if applied)
  TRUST_APPLICATION_RATE: 0.85,

  // Surcharges
  SURCHARGE_CORP_DEFAULT: [
    { threshold: 10000000, rate: 0.07 },   // > ₹1 Cr
    { threshold: 100000000, rate: 0.12 },  // > ₹10 Cr
  ],
  SURCHARGE_CORP_CONCESSIONAL: 0.10,  // capped at 10% for §115BAA/BAB
  SURCHARGE_LLP: 0.12,                // > ₹1 Cr
  SURCHARGE_PROP_HIGH: 0.15,          // individual > ₹5 Cr (old); 0.25% > ₹2Cr new regime

  // Cess
  HEALTH_EDUCATION_CESS: 0.04,

  // GST (rates — not "tax" per se, but compliance)
  GST_RATES: {
    EXEMPT: 0,
    LOW: 0.05,
    MEDIUM: 0.12,
    STANDARD: 0.18,
    LUXURY: 0.28,
  },

  // GST TCS (e-commerce)
  GST_TCS_ECOM: 0.005,  // 0.5% w.e.f. 10 Jul 2024

  // TDS sections — abbreviated (full table in lib/entity/tds-table.ts)
  TDS_DEFAULT: 0.10,
  TDS_NO_PAN: 0.20,

  // TCS
  TCS_GOODS: 0.001,        // 0.1% u/s 206C(1H)
  TCS_FOREIGN_REMITTANCE: 0.20,  // 20% on LRS > ₹7 L
  TCS_TOUR_PACKAGE: 0.05,
  TCS_MOTOR_VEHICLE: 0.01,

  // Transaction taxes
  STT_DELIVERY: 0.001,           // 0.1% on delivery (buy+sell)
  STT_INTRADAY_SELL: 0.00025,    // 0.025% on intraday sell
  STT_FUTURES: 0.0005,           // 0.05% (Budget 2026 hike)
  STT_OPTIONS: 0.0015,           // 0.15% (Budget 2026 hike)
  CTT_NON_AGRI: 0.0001,          // 0.01% on non-agri commodity derivatives

  // CSR
  CSR_RATE: 0.02,  // 2% of avg net profit (last 3 yrs)

  // Equalisation Levy (legacy — 2% abolished Aug 2024; 6% on ads still active)
  EL_ADS: 0.06,
  EL_ECOM: 0.00,  // abolished

  // Stamp Duty (varies by state — using Maharashtra as default)
  STAMP_DUTY_REAL_ESTATE: 0.05,   // 5% (Mumbai)
  STAMP_DUTY_EQUITY: 0.00005,     // ₹0.005 per ₹100
  STAMP_DUTY_DEBENTURE: 0.00005,

  // Professional Tax (annual, state-specific — Maharashtra/Karnataka ~₹2,400)
  PT_ANNUAL_MAX: 2500,

  // Customs — handled per-HSN, no default rate
} as const;

// ============================================================
// Surcharge calculator
// ============================================================

function computeSurcharge(taxableIncome: number, regime: string): number {
  if (regime === "cit_new_115baa" || regime === "cit_new_mfg_115bab") {
    // Capped at 10%
    const baseTax = taxableIncome * (regime === "cit_new_mfg_115bab" ? TAX_RATES.CIT_NEW_MFG_115BAB : TAX_RATES.CIT_NEW_115BAA);
    if (taxableIncome > 10000000) { // > ₹1 Cr
      return baseTax * TAX_RATES.SURCHARGE_CORP_CONCESSIONAL;
    }
    return 0;
  }

  if (regime === "cit_default") {
    let surcharge = 0;
    for (const slab of TAX_RATES.SURCHARGE_CORP_DEFAULT) {
      if (taxableIncome > slab.threshold) {
        surcharge = taxableIncome * TAX_RATES.CIT_DEFAULT * slab.rate;
      }
    }
    return surcharge;
  }

  if (regime === "llp_flat" && taxableIncome > 10000000) {
    return taxableIncome * TAX_RATES.LLP_FLAT * TAX_RATES.SURCHARGE_LLP;
  }

  if (regime === "proprietorship_slab" || regime === "huf_slab") {
    // Individual surcharge (new regime): 10% > ₹50L, 15% > ₹1Cr, 20% > ₹2Cr (capped at 25%)
    if (taxableIncome > 50000000) return computeIndividualTax(taxableIncome) * 0.25;
    if (taxableIncome > 20000000) return computeIndividualTax(taxableIncome) * 0.20;
    if (taxableIncome > 10000000) return computeIndividualTax(taxableIncome) * 0.15;
    if (taxableIncome > 5000000) return computeIndividualTax(taxableIncome) * 0.10;
    return 0;
  }

  return 0;
}

function computeIndividualTax(taxableIncome: number): number {
  let tax = 0;
  let prevSlab = 0;
  for (const slab of TAX_RATES.PROP_NEW_REGIME_SLABS) {
    if (taxableIncome > prevSlab) {
      const slabAmount = Math.min(taxableIncome, slab.upTo) - prevSlab;
      tax += slabAmount * slab.rate;
      prevSlab = slab.upTo;
    } else break;
  }
  return tax;
}

// ============================================================
// Main entity tax computation
// ============================================================

export interface EntityTaxInput {
  entityType: EntityType;
  financialYear: string;
  // Income
  grossIncome: number;
  // Deductions (only applicable for old regime / non-concessional)
  deductions: {
    section80C?: number;       // max ₹1.5L
    section80D?: number;       // health insurance
    section80G?: number;       // donations
    section80TTA?: number;     // savings interest
    depreciation?: number;
    other?: number;
  };
  // GST inputs (if applicable)
  gst?: {
    outputTax: number;         // GST collected on sales
    inputTaxCredit: number;    // ITC on purchases
    rcmLiability: number;      // Reverse Charge Mechanism
  };
  // TDS deducted (already paid)
  tdsDeducted?: number;
  // TCS collected (already paid)
  tcsCollected?: number;
  // Advance tax paid
  advanceTaxPaid?: number;
  // MAT credit available (carried forward)
  matCreditAvailable?: number;
  // CSR-eligible?
  avgNetProfit3yr?: number;    // for CSR computation
  // Customs duty (importers)
  customsDutyPaid?: number;
  // Stamp duty paid (real estate/securities)
  stampDutyPaid?: number;
  // STT/CTT paid (brokers/listed cos)
  sttPaid?: number;
  cttPaid?: number;
  // Equalisation levy (non-resident e-com)
  equalisationLevyReceived?: number;
  // Regime override (if entity can choose)
  regimeOverride?: "old" | "new_115baa" | "new_mfg_115bab" | "default";
}

export interface EntityTaxBreakdown {
  entityType: EntityType;
  financialYear: string;
  regime: string;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  baseTax: number;
  surcharge: number;
  cess: number;
  totalIncomeTax: number;
  mat: number;
  matCreditUsed: number;
  finalIncomeTax: number;
  tdsCredit: number;
  tcsCredit: number;
  advanceTaxPaid: number;
  netTaxPayable: number;
  gstPayable: number;
  gstInputTaxCredit: number;
  gstNetPayable: number;
  customsDuty: number;
  stampDuty: number;
  sttCtt: number;
  equalisationLevy: number;
  professionalTax: number;
  csrLiability: number;
  totalTaxBurden: number;          // sum of all taxes
  effectiveTaxRate: number;        // totalTaxBurden / grossIncome
  recommendations: string[];
}

/**
 * Compute comprehensive tax liability for an entity.
 */
export function computeEntityTax(input: EntityTaxInput): EntityTaxBreakdown {
  const def = getEntityTypeDef(input.entityType);
  const recommendations: string[] = [];

  // 1. Determine effective regime
  let effectiveRegime = def.taxRegime;
  if (input.regimeOverride && def.taxRegime === "cit_new_115baa") {
    if (input.regimeOverride === "default") effectiveRegime = "cit_default";
    // (could allow old regime for proprietorship/HUF)
  }

  // 2. Compute deductions
  const ded = input.deductions;
  const totalDeductions =
    Math.min(ded.section80C || 0, 150000) +
    Math.min(ded.section80D || 0, 100000) +
    (ded.section80G || 0) +
    Math.min(ded.section80TTA || 0, 10000) +
    (ded.depreciation || 0) +
    (ded.other || 0);

  // For new concessional regimes (§115BAA/BAB), no deductions allowed
  const deductionsApplicable =
    effectiveRegime === "cit_new_115baa" || effectiveRegime === "cit_new_mfg_115bab"
      ? 0
      : totalDeductions;

  // 3. Taxable income
  const taxableIncome = Math.max(0, input.grossIncome - deductionsApplicable);

  // 4. Exempt entities — zero income tax
  if (isIncomeTaxExempt(input.entityType)) {
    return buildExemptResult(input, taxableIncome, totalDeductions, recommendations);
  }

  // 5. Compute base tax by regime
  let baseTax = 0;
  let matTax = 0;
  let matCreditUsed = 0;

  switch (effectiveRegime) {
    case "cit_new_115baa":
      baseTax = taxableIncome * TAX_RATES.CIT_NEW_115BAA;
      break;
    case "cit_new_mfg_115bab":
      baseTax = taxableIncome * TAX_RATES.CIT_NEW_MFG_115BAB;
      break;
    case "cit_default":
      baseTax = taxableIncome * TAX_RATES.CIT_DEFAULT;
      // MAT check
      if (def.matApplicable) {
        const bookProfit = input.grossIncome - (ded.depreciation || 0); // simplified
        matTax = Math.max(0, bookProfit) * TAX_RATES.MAT;
        if (matTax > baseTax) {
          matCreditUsed = Math.min(matTax - baseTax, input.matCreditAvailable || 0);
        }
      }
      break;
    case "llp_flat":
      baseTax = taxableIncome * TAX_RATES.LLP_FLAT;
      break;
    case "proprietorship_slab":
    case "huf_slab":
      baseTax = computeIndividualTax(taxableIncome);
      break;
    case "trust_12ab":
      // 85% application rule — if 85% of income applied to charitable objects, tax = 0
      // For computation, assume application
      baseTax = 0;
      recommendations.push("Trust/NGO: Ensure 85% of income is applied to charitable objects to claim full exemption under Section 11.");
      break;
    case "coop_slab":
      if (taxableIncome <= 10000) baseTax = taxableIncome * TAX_RATES.COOP_SLAB_LOW;
      else if (taxableIncome <= 20000) baseTax = 10000 * TAX_RATES.COOP_SLAB_LOW + (taxableIncome - 10000) * TAX_RATES.COOP_SLAB_MID;
      else baseTax = 10000 * TAX_RATES.COOP_SLAB_LOW + 10000 * TAX_RATES.COOP_SLAB_MID + (taxableIncome - 20000) * TAX_RATES.COOP_SLAB_HIGH;
      break;
    case "exempt_govt":
    case "exempt_local_authority":
      baseTax = 0;
      break;
  }

  // 6. Surcharge
  const surcharge = computeSurcharge(taxableIncome, effectiveRegime);

  // 7. Cess (4% on tax + surcharge)
  const cess = (baseTax + surcharge) * TAX_RATES.HEALTH_EDUCATION_CESS;

  // 8. Total income tax (before credits)
  const totalIncomeTax = baseTax + surcharge + cess;

  // 9. MAT credit utilization
  const finalIncomeTax = Math.max(totalIncomeTax, matTax) - matCreditUsed;

  // 10. Credits
  const tdsCredit = input.tdsDeducted || 0;
  const tcsCredit = input.tcsCollected || 0;
  const advanceTaxPaid = input.advanceTaxPaid || 0;

  const netTaxPayable = Math.max(0, finalIncomeTax - tdsCredit - tcsCredit - advanceTaxPaid);

  // 11. GST
  let gstPayable = 0;
  let gstInputTaxCredit = 0;
  let gstNetPayable = 0;
  if (def.gstApplicable && input.gst) {
    gstPayable = input.gst.outputTax + (input.gst.rcmLiability || 0);
    gstInputTaxCredit = input.gst.inputTaxCredit;
    gstNetPayable = Math.max(0, gstPayable - gstInputTaxCredit);
  }

  // 12. Other taxes
  const customsDuty = input.customsDutyPaid || 0;
  const stampDuty = input.stampDutyPaid || 0;
  const sttCtt = (input.sttPaid || 0) + (input.cttPaid || 0);
  const equalisationLevy = (input.equalisationLevyReceived || 0) * TAX_RATES.EL_ADS;
  const professionalTax = def.professionalTaxApplicable ? TAX_RATES.PT_ANNUAL_MAX : 0;

  // 13. CSR
  let csrLiability = 0;
  if (def.csrApplicable && input.avgNetProfit3yr && input.avgNetProfit3yr > 5000000) {
    csrLiability = input.avgNetProfit3yr * TAX_RATES.CSR_RATE;
    recommendations.push(`CSR: Spend ₹${Math.round(csrLiability).toLocaleString("en-IN")} (2% of avg net profit) on CSR activities or explain shortfall in CSR-2.`);
  }

  // 14. Total tax burden
  const totalTaxBurden =
    finalIncomeTax +
    gstNetPayable +
    customsDuty +
    stampDuty +
    sttCtt +
    equalisationLevy +
    professionalTax +
    csrLiability;

  const effectiveTaxRate = input.grossIncome > 0 ? totalTaxBurden / input.grossIncome : 0;

  // 15. Recommendations
  if (effectiveRegime === "cit_default" && taxableIncome > 10000000) {
    recommendations.push("Consider opting for §115BAA concessional regime (22% + 10% surcharge cap + 4% cess = 25.17%) — likely lower than default 30% + surcharge.");
  }
  if (def.matApplicable && matTax > baseTax) {
    recommendations.push(`MAT applies (₹${Math.round(matTax).toLocaleString("en-IN")}). MAT credit of ₹${Math.round(matTax - baseTax).toLocaleString("en-IN")} can be carried forward for 15 years.`);
  }
  if (def.transferPricingRisk) {
    recommendations.push("Transfer Pricing: File Form 3CEB (CA certificate) and TP disclosure in ITR. International transactions > ₹1 Cr require arm's length price documentation.");
  }
  if (def.csrApplicable && (!input.avgNetProfit3yr || input.avgNetProfit3yr <= 5000000)) {
    recommendations.push("CSR not applicable (net profit ≤ ₹5 Cr) — but still file CSR-2 with Nil disclosure.");
  }
  if (def.gstApplicable && (!input.gst || input.gst.outputTax === 0)) {
    recommendations.push("GST registered but no output tax reported — verify if all taxable supplies are captured.");
  }
  if (input.entityType === "it_ites_company") {
    recommendations.push("IT/ITES: SEZ supplies are zero-rated with ITC refund. File LUT for export of services without payment of IGST.");
  }
  if (input.entityType === "ecommerce_operator") {
    recommendations.push("E-commerce: TCS @ 0.5% on seller payouts (w.e.f. 10 Jul 2024). File GSTR-8 by 10th of next month.");
  }
  if (input.entityType === "real_estate_developer") {
    recommendations.push("Real Estate: GST 1% (affordable ≤₹45 L) / 5% (non-affordable) without ITC. Ready-to-move properties are GST-exempt.");
  }
  if (input.entityType === "manufacturing_unit") {
    recommendations.push("Manufacturing: If incorporated after 1 Oct 2019, §115BAB offers 15% CIT (17.16% effective). New manufacturing units get significant tax benefit.");
  }
  if (input.entityType === "trust_ngo") {
    recommendations.push("Trust/NGO: File Form 10B/10BB (audit report) and ITR-7. Maintain 85% application ratio or accumulate via Form 10.");
  }
  if (effectiveTaxRate > 0.30) {
    recommendations.push(`⚠ Effective tax rate ${(effectiveTaxRate * 100).toFixed(1)}% is high — review tax planning opportunities (entity restructuring, regime selection, ITC optimisation).`);
  }

  return {
    entityType: input.entityType,
    financialYear: input.financialYear,
    regime: effectiveRegime,
    grossIncome: input.grossIncome,
    totalDeductions: deductionsApplicable,
    taxableIncome,
    baseTax,
    surcharge,
    cess,
    totalIncomeTax,
    mat: matTax,
    matCreditUsed,
    finalIncomeTax,
    tdsCredit,
    tcsCredit,
    advanceTaxPaid,
    netTaxPayable,
    gstPayable,
    gstInputTaxCredit,
    gstNetPayable,
    customsDuty,
    stampDuty,
    sttCtt,
    equalisationLevy,
    professionalTax,
    csrLiability,
    totalTaxBurden,
    effectiveTaxRate,
    recommendations,
  };
}

function buildExemptResult(
  input: EntityTaxInput,
  taxableIncome: number,
  totalDeductions: number,
  recommendations: string[]
): EntityTaxBreakdown {
  recommendations.push("This entity is exempt from income tax under Section 10. Only TDS on payments to vendors applies.");

  // TDS still applies to exempt entities (govt departments deduct TDS on vendor payments)
  const professionalTax = false;

  const totalTaxBurden =
    (input.customsDutyPaid || 0) +
    (input.stampDutyPaid || 0) +
    (input.sttPaid || 0) +
    (input.cttPaid || 0) +
    (professionalTax ? TAX_RATES.PT_ANNUAL_MAX : 0);

  return {
    entityType: input.entityType,
    financialYear: input.financialYear,
    regime: "exempt",
    grossIncome: input.grossIncome,
    totalDeductions,
    taxableIncome,
    baseTax: 0,
    surcharge: 0,
    cess: 0,
    totalIncomeTax: 0,
    mat: 0,
    matCreditUsed: 0,
    finalIncomeTax: 0,
    tdsCredit: input.tdsDeducted || 0,
    tcsCredit: input.tcsCollected || 0,
    advanceTaxPaid: input.advanceTaxPaid || 0,
    netTaxPayable: 0,
    gstPayable: 0,
    gstInputTaxCredit: 0,
    gstNetPayable: 0,
    customsDuty: input.customsDutyPaid || 0,
    stampDuty: input.stampDutyPaid || 0,
    sttCtt: (input.sttPaid || 0) + (input.cttPaid || 0),
    equalisationLevy: 0,
    professionalTax: 0,
    csrLiability: 0,
    totalTaxBurden,
    effectiveTaxRate: input.grossIncome > 0 ? totalTaxBurden / input.grossIncome : 0,
    recommendations,
  };
}

/**
 * Compare two regimes for an entity to recommend the optimal one.
 */
export function compareRegimes(input: EntityTaxInput): {
  newRegime: EntityTaxBreakdown;
  defaultRegime: EntityTaxBreakdown;
  recommendation: "new" | "default";
  savings: number;
} {
  const newRegimeInput = { ...input, regimeOverride: "new_115baa" as const };
  const defaultRegimeInput = { ...input, regimeOverride: "default" as const };

  const newRegime = computeEntityTax(newRegimeInput);
  const defaultRegime = computeEntityTax(defaultRegimeInput);

  const recommendation = newRegime.finalIncomeTax <= defaultRegime.finalIncomeTax ? "new" : "default";
  const savings = Math.abs(newRegime.finalIncomeTax - defaultRegime.finalIncomeTax);

  return { newRegime, defaultRegime, recommendation, savings };
}
