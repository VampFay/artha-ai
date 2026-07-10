/**
 * Custom Tax Rules per Tenant
 * ---------------------------
 * Banks/NBFCs may have different deduction logic, custom tax slabs,
 * or special exemptions. This module loads tenant-specific overrides
 * on top of the default Indian tax engine.
 *
 * Override keys (examples):
 *   - "80c_limit"            : ₹1,50,000 default
 *   - "standard_deduction"   : ₹75,000 default (FY 2024-25)
 *   - "cess_rate"            : 4% default
 *   - "surcharge_threshold"  : ₹50L default
 *   - "new_regime_slabs"     : JSON array of slabs
 *   - "old_regime_slabs"     : JSON array of slabs
 *   - "80d_self_limit"       : ₹25,000 default
 *   - "80d_parent_limit"     : ₹50,000 default
 *   - "hra_exemption_calc"   : "metro" | "non_metro" | "custom"
 *   - "home_loan_interest"   : ₹2,00,000 default
 */

import { db } from "../db";

export interface TaxRuleOverrideValue {
  ruleKey: string;
  value: any;
  financialYear: string;
}

/**
 * Load all tax rule overrides for a tenant in a financial year.
 */
export async function loadTenantTaxOverrides(
  tenantId: string | null,
  financialYear: string
): Promise<Map<string, any>> {
  if (!tenantId) return new Map();

  const overrides = await db.taxRuleOverride.findMany({
    where: {
      tenantId,
      financialYear,
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: new Date() } },
      ],
      effectiveFrom: { lte: new Date() },
    },
  });

  const map = new Map<string, any>();
  for (const o of overrides) {
    let value: any = o.ruleValueJson;
    try { value = JSON.parse(o.ruleValueJson); } catch {}
    map.set(o.ruleKey, value);
  }
  return map;
}

/**
 * Get a single tax rule override, with fallback to default.
 */
export async function getTaxRule(
  tenantId: string | null,
  ruleKey: string,
  financialYear: string,
  defaultValue: any
): Promise<any> {
  if (!tenantId) return defaultValue;

  const override = await db.taxRuleOverride.findUnique({
    where: {
      tenantId_ruleKey_financialYear: {
        tenantId,
        ruleKey,
        financialYear,
      },
    },
  });

  if (!override) return defaultValue;
  if (override.effectiveTo && override.effectiveTo < new Date()) return defaultValue;

  try {
    return JSON.parse(override.ruleValueJson);
  } catch {
    return override.ruleValueJson;
  }
}

/**
 * Set a tax rule override for a tenant.
 */
export async function setTaxRule(
  tenantId: string,
  ruleKey: string,
  value: any,
  financialYear: string,
  notes?: string
): Promise<void> {
  await db.taxRuleOverride.upsert({
    where: {
      tenantId_ruleKey_financialYear: {
        tenantId,
        ruleKey,
        financialYear,
      },
    },
    update: {
      ruleValueJson: JSON.stringify(value),
      notes,
      effectiveFrom: new Date(),
    },
    create: {
      tenantId,
      ruleKey,
      ruleValueJson: JSON.stringify(value),
      financialYear,
      notes,
    },
  });
}

/**
 * Default Indian tax rules (FY 2024-25).
 */
export const DEFAULT_TAX_RULES = {
  // Section 80C — Investments
  "80c_limit": 150000,
  "80ccc_limit": 150000, // pension fund (within 80C)
  "80ccd1_limit": 150000, // NPS (within 80C)
  "80ccd1b_extra": 50000, // additional NPS

  // Section 80D — Health insurance
  "80d_self_limit": 25000,
  "80d_self_senior_limit": 50000,
  "80d_parent_limit": 25000,
  "80d_parent_senior_limit": 50000,
  "80d_preventive_checkup": 5000,

  // Section 80E — Education loan interest (no limit, max 8 years)
  "80e_max_years": 8,

  // Section 80G — Donations
  "80g_cash_limit": 2000,

  // Section 80GG — Rent (when no HRA)
  "80gg_limit": 60000,

  // Section 24 — Home loan interest
  "home_loan_interest_self_occupied": 200000,
  "home_loan_interest_let_out_max": 200000, // loss setoff limit

  // Standard deduction
  "standard_deduction_salaried": 75000, // FY 2024-25 (raised from 50000)

  // Health and Education Cess
  "cess_rate": 0.04,

  // Surcharge
  "surcharge_threshold_high": 5000000, // ₹50L
  "surcharge_threshold_highest": 20000000, // ₹2Cr
  "surcharge_rate_50L_to_1Cr": 0.10,
  "surcharge_rate_1Cr_to_2Cr": 0.15,
  "surcharge_rate_2Cr_to_5Cr": 0.25,
  "surcharge_rate_above_5Cr": 0.37,
  "surcharge_cap_new_regime": 0.25, // capped at 25% in new regime

  // New regime slabs (FY 2024-25)
  "new_regime_slabs": [
    { upTo: 300000, rate: 0 },
    { upTo: 700000, rate: 0.05 },
    { upTo: 1000000, rate: 0.10 },
    { upTo: 1200000, rate: 0.15 },
    { upTo: 1500000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 },
  ],

  // Old regime slabs (FY 2024-25)
  "old_regime_slabs": [
    { upTo: 250000, rate: 0 },
    { upTo: 500000, rate: 0.05 },
    { upTo: 1000000, rate: 0.20 },
    { upTo: Infinity, rate: 0.30 },
  ],

  // Rebate u/s 87A
  "rebate_87a_new_regime_income_limit": 700000,
  "rebate_87a_new_regime_amount": 25000,
  "rebate_87a_old_regime_income_limit": 500000,
  "rebate_87a_old_regime_amount": 12500,
} as const;

/**
 * Get all effective tax rules for a tenant (defaults + overrides).
 */
export async function getEffectiveTaxRules(
  tenantId: string | null,
  financialYear: string
): Promise<Record<string, any>> {
  const overrides = await loadTenantTaxOverrides(tenantId, financialYear);
  const result: Record<string, any> = { ...DEFAULT_TAX_RULES };
  for (const [key, value] of overrides) {
    result[key] = value;
  }
  return result;
}
