/**
 * DTAA (Double Taxation Avoidance Agreement) Matrix
 * --------------------------------------------------
 * India has DTAAs with 95+ countries. This module provides:
 *   - Withholding rate lookup by country + income type
 *   - Treaty vs domestic rate comparison (lower applies)
 *   - Permanent Establishment (PE) risk detection
 *   - Form 10F generation support
 *   - TRC (Tax Residency Certificate) verification framework
 *
 * Source: Income Tax Act Section 90, 90A, 91
 * Rates from OECD MLI + bilateral treaty texts.
 */

export type IncomeType = "dividend" | "interest" | "royalty" | "fts" | "capital_gains";

export interface DtaaEntry {
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  treatySigned: string; // Year
  rates: {
    dividend: { limit: number; treaty: number; conditions?: string };
    interest: { limit: number; treaty: number; conditions?: string };
    royalty: { limit: number; treaty: number; conditions?: string };
    fts: { limit: number; treaty: number; conditions?: string };
    capital_gains: { treaty: number; notes?: string };
  };
  panEquivalence: boolean; // Does treaty require PAN for lower rate?
  trcRequired: boolean; // Tax Residency Certificate required
  form10FRequired: boolean;
  notes?: string;
}

/**
 * Top DTAAs (by usage — India's most-treaty-active countries).
 */
export const DTAA_MATRIX: Record<string, DtaaEntry> = {
  US: {
    country: "United States",
    countryCode: "US",
    treatySigned: "1989",
    rates: {
      dividend: { limit: 0.15, treaty: 0.15, conditions: "10% if beneficial owner holds ≥10% of voting power" },
      interest: { limit: 0.15, treaty: 0.15, conditions: "15% standard; 10% for bank loans" },
      royalty: { limit: 0.15, treaty: 0.15 },
      fts: { limit: 0.15, treaty: 0.15 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state (no relief)" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
  MU: {
    country: "Mauritius",
    countryCode: "MU",
    treatySigned: "1983",
    rates: {
      dividend: { limit: 0.05, treaty: 0.05, conditions: "0% if beneficial owner holds ≥10% capital; 5% otherwise" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "0% for banks/Govt; 7.5% others" },
      royalty: { limit: 0.15, treaty: 0.15 },
      fts: { limit: 0.10, treaty: 0.10 },
      capital_gains: { treaty: 0.50, notes: "50% of Indian rate (post-2017 protocol). Pre-2017: 0% (grandfathered)" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
    notes: "Most-used treaty for FDI into India. Capital gains grandfathering ended April 2017.",
  },
  SG: {
    country: "Singapore",
    countryCode: "SG",
    treatySigned: "1994",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "0% if ≥25% capital; 10% otherwise" },
      interest: { limit: 0.15, treaty: 0.15, conditions: "0% for Govt/banks" },
      royalty: { limit: 0.10, treaty: 0.10 },
      fts: { limit: 0.10, treaty: 0.10 },
      capital_gains: { treaty: 0.50, notes: "50% of Indian rate (post-2017 protocol)" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
    notes: "Second-most-used treaty for FDI. Capital gains grandfathering ended April 2017.",
  },
  AE: {
    country: "United Arab Emirates",
    countryCode: "AE",
    treatySigned: "1993",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "0% if ≥10% capital; 10% otherwise" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "0% for Govt; 7.5% others" },
      royalty: { limit: 0.10, treaty: 0.10 },
      fts: { limit: 0, treaty: 0, conditions: "0% treaty rate (limit: domestic 10%)" },
      capital_gains: { treaty: 0.50, notes: "50% of Indian rate" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
    notes: "Popular for holding company structures. FTS at 0% treaty rate.",
  },
  GB: {
    country: "United Kingdom",
    countryCode: "GB",
    treatySigned: "1993",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "5% if ≥10% capital; 10% otherwise; 15% non-treaty" },
      interest: { limit: 0.10, treaty: 0.10, conditions: "0% for Govt" },
      royalty: { limit: 0.10, treaty: 0.10 },
      fts: { limit: 0.10, treaty: 0.10 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
  NL: {
    country: "Netherlands",
    countryCode: "NL",
    treatySigned: "1988",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "5% if ≥10% capital; 10% otherwise" },
      interest: { limit: 0.10, treaty: 0.10 },
      royalty: { limit: 0.06, treaty: 0.06, conditions: "6% for equipment; 10% otherwise" },
      fts: { limit: 0.10, treaty: 0.10 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
    notes: "Popular for holding company structures. Royalty rate reduced to 6% for equipment.",
  },
  JP: {
    country: "Japan",
    countryCode: "JP",
    treatySigned: "1989",
    rates: {
      dividend: { limit: 0.15, treaty: 0.15, conditions: "10% if ≥10% voting; 15% otherwise" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "10% standard; 7.5% banks" },
      royalty: { limit: 0.10, treaty: 0.10 },
      fts: { limit: 0.10, treaty: 0.10 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
  DE: {
    country: "Germany",
    countryCode: "DE",
    treatySigned: "1995",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "10% standard; 15% non-treaty" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "10% standard; 7.5% banks" },
      royalty: { limit: 0.075, treaty: 0.075, conditions: "7.5% for equipment; 10% otherwise" },
      fts: { limit: 0.075, treaty: 0.075, conditions: "7.5% if ≤€5000/year; 10% otherwise" },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
  FR: {
    country: "France",
    countryCode: "FR",
    treatySigned: "1994",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "0% if ≥25% capital held ≥2 yrs; 10% otherwise" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "0% for Govt; 7.5% others" },
      royalty: { limit: 0.075, treaty: 0.075 },
      fts: { limit: 0.075, treaty: 0.075 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
  CH: {
    country: "Switzerland",
    countryCode: "CH",
    treatySigned: "1994",
    rates: {
      dividend: { limit: 0.10, treaty: 0.10, conditions: "10% if ≥10% capital; 15% otherwise" },
      interest: { limit: 0.075, treaty: 0.075, conditions: "0% for Govt/banks" },
      royalty: { limit: 0.075, treaty: 0.075 },
      fts: { limit: 0.075, treaty: 0.075 },
      capital_gains: { treaty: 0, notes: "Full taxation in source state" },
    },
    panEquivalence: true,
    trcRequired: true,
    form10FRequired: true,
  },
};

/**
 * Domestic withholding rates (Income Tax Act, no treaty).
 */
export const DOMESTIC_RATES: Record<IncomeType, { rate: number; section: string }> = {
  dividend: { rate: 0.20, section: "196D" },
  interest: { rate: 0.20, section: "196A" },
  royalty: { rate: 0.10, section: "196DA" },
  fts: { rate: 0.10, section: "196DA" },
  capital_gains: { rate: 0, section: "195" }, // Capital gains taxed at applicable rates
};

/**
 * Get the applicable withholding rate for a payment to a non-resident.
 * Applies the "lower of treaty vs domestic" rule.
 */
export function getWithholdingRate(
  countryCode: string,
  incomeType: IncomeType,
  hasPAN: boolean = true,
  hasTRC: boolean = true,
  hasForm10F: boolean = true
): {
  applicableRate: number;
  treatyRate: number | null;
  domesticRate: number;
  appliedSource: "treaty" | "domestic" | "no_pan";
  conditions: string[];
  requirements: string[];
} {
  const conditions: string[] = [];
  const requirements: string[] = [];

  // Domestic rate (always applicable)
  const domesticEntry = DOMESTIC_RATES[incomeType];
  let domesticRate = domesticEntry.rate;

  // No PAN → 20% (Section 206AA)
  if (!hasPAN) {
    conditions.push("No PAN provided → 20% withholding (Section 206AA)");
    return {
      applicableRate: 0.20,
      treatyRate: null,
      domesticRate: 0.20,
      appliedSource: "no_pan",
      conditions,
      requirements: ["Obtain PAN for lower rate", "Submit Form 10F if treaty benefit claimed"],
    };
  }

  // Treaty lookup
  const treaty = DTAA_MATRIX[countryCode.toUpperCase()];
  if (!treaty) {
    // No treaty → domestic rate applies
    conditions.push(`No DTAA with ${countryCode} — domestic rate applies`);
    return {
      applicableRate: domesticRate,
      treatyRate: null,
      domesticRate,
      appliedSource: "domestic",
      conditions,
      requirements: [],
    };
  }

  // Treaty rate exists — check requirements
  if (treaty.trcRequired && !hasTRC) {
    requirements.push("Tax Residency Certificate (TRC) required for treaty benefit");
    conditions.push("TRC not provided → domestic rate applies");
    return {
      applicableRate: domesticRate,
      treatyRate: treaty.rates[incomeType].treaty,
      domesticRate,
      appliedSource: "domestic",
      conditions,
      requirements,
    };
  }

  if (treaty.form10FRequired && !hasForm10F) {
    requirements.push("Form 10F required for treaty benefit");
    conditions.push("Form 10F not provided → domestic rate applies");
    return {
      applicableRate: domesticRate,
      treatyRate: treaty.rates[incomeType].treaty,
      domesticRate,
      appliedSource: "domestic",
      conditions,
      requirements,
    };
  }

  // Apply lower of treaty vs domestic
  const treatyRate = treaty.rates[incomeType].treaty;
  const applicableRate = Math.min(treatyRate, domesticRate);
  const appliedSource = treatyRate <= domesticRate ? "treaty" : "domestic";

  if (treaty.rates[incomeType].conditions) {
    conditions.push(treaty.rates[incomeType].conditions!);
  }

  conditions.push(`${treaty.country} DTAA signed ${treaty.treatySigned}`);
  conditions.push(`Treaty rate: ${(treatyRate * 100).toFixed(1)}%`);
  conditions.push(`Domestic rate: ${(domesticRate * 100).toFixed(1)}%`);
  conditions.push(`Applied: ${(applicableRate * 100).toFixed(1)}% (${appliedSource})`);

  return {
    applicableRate,
    treatyRate,
    domesticRate,
    appliedSource,
    conditions,
    requirements,
  };
}

/**
 * Check if a non-resident has Permanent Establishment (PE) risk in India.
 */
export function checkPERisk(
  countryCode: string,
  hasOfficeInIndia: boolean,
  hasAgentInIndia: boolean,
  stayDaysInIndia: number,
  hasServerInIndia: boolean
): { hasPE: boolean; peType: string | null; riskLevel: "low" | "medium" | "high" } {
  // Fixed place PE
  if (hasOfficeInIndia) {
    return { hasPE: true, peType: "Fixed Place PE", riskLevel: "high" };
  }

  // Dependent agent PE
  if (hasAgentInIndia) {
    return { hasPE: true, peType: "Dependent Agent PE", riskLevel: "high" };
  }

  // Server PE (digital presence)
  if (hasServerInIndia) {
    return { hasPE: true, peType: "Server PE (digital)", riskLevel: "high" };
  }

  // Service PE (183 days in any 12-month period)
  if (stayDaysInIndia >= 183) {
    return { hasPE: true, peType: "Service PE (183 days)", riskLevel: "high" };
  }

  if (stayDaysInIndia >= 90) {
    return { hasPE: false, peType: null, riskLevel: "medium" };
  }

  return { hasPE: false, peType: null, riskLevel: "low" };
}

/**
 * List all countries with DTAAs.
 */
export function listDtaaCountries(): Array<{ code: string; country: string; year: string }> {
  return Object.values(DTAA_MATRIX).map(e => ({
    code: e.countryCode,
    country: e.country,
    year: e.treatySigned,
  }));
}
