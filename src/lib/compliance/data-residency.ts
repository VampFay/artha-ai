/**
 * Data Residency & Localization
 * ------------------------------
 * Enforces data residency requirements per jurisdiction:
 *   - India (ap-south-1)        : RBI / DPDP Act
 *   - EU (eu-west-1)            : GDPR
 *   - US (us-east-1)            : CCPA / state laws
 *   - Singapore (ap-southeast-1): MAS guidelines
 *
 * Each tenant has a dataResidency region; all storage operations
 * route to the correct regional bucket / database.
 */

export type ResidencyRegion = "ap-south-1" | "eu-west-1" | "us-east-1" | "ap-southeast-1";

export interface ResidencyPolicy {
  region: ResidencyRegion;
  description: string;
  allowedProcessing: string[];
  crossBorderTransferAllowed: boolean;
  sccRequired: boolean; // Standard Contractual Clauses (GDPR)
  dataLocalizationMandatory: boolean;
  retentionYears: number;
}

export const RESIDENCY_POLICIES: Record<ResidencyRegion, ResidencyPolicy> = {
  "ap-south-1": {
    region: "ap-south-1",
    description: "India — RBI Master Directions + DPDP Act 2023",
    allowedProcessing: ["financial_analysis", "tax_computation", "wealth_management"],
    crossBorderTransferAllowed: false, // DPDP requires explicit consent + govt approval
    sccRequired: false,
    dataLocalizationMandatory: true, // RBI: financial data must stay in India
    retentionYears: 7,
  },
  "eu-west-1": {
    region: "eu-west-1",
    description: "European Union — GDPR",
    allowedProcessing: ["financial_analysis", "tax_computation"],
    crossBorderTransferAllowed: true,
    sccRequired: true, // SCCs required for transfers outside EU
    dataLocalizationMandatory: false,
    retentionYears: 7,
  },
  "us-east-1": {
    region: "us-east-1",
    description: "United States — CCPA + state laws",
    allowedProcessing: ["financial_analysis", "tax_computation"],
    crossBorderTransferAllowed: true,
    sccRequired: false,
    dataLocalizationMandatory: false,
    retentionYears: 7,
  },
  "ap-southeast-1": {
    region: "ap-southeast-1",
    description: "Singapore — MAS Technology Risk Management Guidelines",
    allowedProcessing: ["financial_analysis", "tax_computation"],
    crossBorderTransferAllowed: true,
    sccRequired: false,
    dataLocalizationMandatory: false,
    retentionYears: 7,
  },
};

/**
 * Get the S3 bucket name for a tenant's region.
 */
export function getBucketName(region: ResidencyRegion, tenantSlug: string): string {
  return `artha-${region}-${tenantSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`.slice(0, 63);
}

/**
 * Validate that a processing operation is allowed for a tenant's region.
 */
export function validateProcessingAllowed(
  region: ResidencyRegion,
  processingType: string
): { allowed: boolean; reason?: string } {
  const policy = RESIDENCY_POLICIES[region];
  if (!policy) {
    return { allowed: false, reason: `Unknown region: ${region}` };
  }
  if (!policy.allowedProcessing.includes(processingType)) {
    return {
      allowed: false,
      reason: `Processing type "${processingType}" not allowed in region ${region}`,
    };
  }
  return { allowed: true };
}

/**
 * Check if cross-border data transfer is allowed.
 */
export function canTransferData(
  sourceRegion: ResidencyRegion,
  destRegion: ResidencyRegion
): { allowed: boolean; reason?: string } {
  if (sourceRegion === destRegion) return { allowed: true };

  const sourcePolicy = RESIDENCY_POLICIES[sourceRegion];
  if (!sourcePolicy.crossBorderTransferAllowed) {
    return {
      allowed: false,
      reason: `Data localization mandatory in ${sourceRegion} (${sourcePolicy.description})`,
    };
  }

  return { allowed: true };
}
