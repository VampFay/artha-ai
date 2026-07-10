/**
 * Entity Type System
 * ------------------
 * Defines the institution archetypes supported by the Business Portal.
 * Each archetype has:
 *   - Tax regime applicability (CIT/MAT/LLP/Trust/Co-op/etc.)
 *   - GST applicability + rates
 *   - TDS/TCS sections that apply
 *   - Sector-specific regulators (RBI/SEBI/IRDAI/MCA/UGC/RERA)
 *   - Compliance burden (filing calendar complexity)
 *   - Default roles (which RBAC roles to seed)
 *
 * Source: research/business-portal/BUSINESS_PORTAL_RESEARCH.md (Phase 4)
 */

export type EntityType =
  | "private_limited"        // Pvt Ltd company
  | "public_limited"         // Listed public company
  | "llp"                    // Limited Liability Partnership
  | "partnership_firm"       // Traditional partnership
  | "proprietorship"         // Sole proprietorship
  | "bank"                   // Commercial bank (RBI regulated)
  | "nbfc"                   // Non-Banking Financial Company
  | "insurance_company"      // IRDAI regulated
  | "psu"                    // Public Sector Undertaking
  | "government_dept"        // Central/State government department
  | "local_authority"        // Municipal corp, panchayat
  | "university_govt"        // Govt-funded university (IIT/IIM)
  | "university_private"     // Private university
  | "school"                 // K-12 school
  | "trust_ngo"              // Charitable trust / NGO
  | "section_8_company"      // Non-profit company
  | "cooperative_society"    // Co-op bank, milk union, FPO
  | "huf"                    // Hindu Undivided Family
  | "society_club"           // Housing society, club
  | "ecommerce_operator"     // Amazon, Flipkart-style marketplace
  | "manufacturing_unit"     // Goods manufacturer
  | "real_estate_developer"  // RERA-registered developer
  | "it_ites_company"        // IT/software/ITES (incl. SEZ)
  | "fintech_pa"             // Payment Aggregator (RBI)
  | "healthcare_provider"    // Hospital, diagnostic chain
  | "pharma_company"         // Drug manufacturer
  | "agriculture_fpo"        // Farmer Producer Organisation
  | "msme_small"             // Udyam-registered small enterprise
  | "msme_micro"             // Udyam-registered micro enterprise
  | "msme_medium";           // Udyam-registered medium enterprise

export type IndustrySector =
  | "banking_finance"
  | "insurance"
  | "education"
  | "healthcare"
  | "pharma"
  | "manufacturing"
  | "it_services"
  | "real_estate"
  | "ecommerce"
  | "fintech"
  | "agriculture"
  | "retail"
  | "logistics"
  | "telecom"
  | "energy_utilities"
  | "media_entertainment"
  | "construction"
  | "hospitality"
  | "professional_services"
  | "government"
  | "non_profit"
  | "other";

export type Regulator =
  | "mca"        // Ministry of Corporate Affairs
  | "rbi"        // Reserve Bank of India
  | "sebi"       // Securities and Exchange Board of India
  | "irdai"      // Insurance Regulatory and Development Authority
  | "ugc"        // University Grants Commission
  | "aicte"      // All India Council for Technical Education
  | "rera"       // Real Estate Regulatory Authority
  | "cbic"       // Central Board of Indirect Taxes and Customs (GST)
  | "cbd_t"      // Central Board of Direct Taxes (Income Tax)
  | "nppa"       // National Pharmaceutical Pricing Authority
  | "trai"       // Telecom Regulatory Authority
  | "stpi"       // Software Technology Parks of India
  | "dgft"       // Director General of Foreign Trade
  | "roc"        // Registrar of Companies
  | "registrar_societies"
  | "registrar_trusts"
  | "none";

export interface EntityTypeDef {
  type: EntityType;
  label: string;
  shortLabel: string;
  category: "corporate" | "financial" | "government" | "education" | "non_profit" | "msme" | "other";
  description: string;
  regulators: Regulator[];
  taxRegime: "cit_new_115baa" | "cit_new_mfg_115bab" | "cit_default" | "llp_flat" | "proprietorship_slab" | "trust_12ab" | "coop_slab" | "exempt_govt" | "exempt_local_authority" | "huf_slab";
  gstApplicable: boolean;
  gstDefaultRate: number; // 0, 5, 12, 18, 28
  tdsApplicable: boolean;
  tcsApplicable: boolean;
  csrApplicable: boolean;
  matApplicable: boolean;
  transferPricingRisk: boolean; // for MNCs
  equalisationLevyRisk: boolean;
  stampDutyApplicable: boolean;
  professionalTaxApplicable: boolean;
  defaultRoles: string[]; // RBAC roles to seed
  iconEmoji: string;
  turnoverThresholdMsme?: "micro" | "small" | "medium"; // For MSME classification
}

/**
 * Master registry of all entity types with their tax applicability.
 * Source: research/business-portal/BUSINESS_PORTAL_RESEARCH.md §4.6
 */
export const ENTITY_TYPES: Record<EntityType, EntityTypeDef> = {
  private_limited: {
    type: "private_limited",
    label: "Private Limited Company",
    shortLabel: "Pvt Ltd",
    category: "corporate",
    description: "Privately held company with limited liability, incorporated under Companies Act 2013",
    regulators: ["mca", "roc", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false, // depends on thresholds
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏢",
  },
  public_limited: {
    type: "public_limited",
    label: "Public Limited Company (Listed)",
    shortLabel: "Ltd (Listed)",
    category: "corporate",
    description: "Listed company with shares traded on stock exchange; SEBI regulated",
    regulators: ["mca", "roc", "sebi", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: true,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "📈",
  },
  llp: {
    type: "llp",
    label: "Limited Liability Partnership",
    shortLabel: "LLP",
    category: "corporate",
    description: "Hybrid partnership with limited liability; flat 30% tax, no MAT",
    regulators: ["mca", "roc", "cbd_t", "cbic"],
    taxRegime: "llp_flat",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "analyst", "auditor", "viewer"],
    iconEmoji: "🤝",
  },
  partnership_firm: {
    type: "partnership_firm",
    label: "Partnership Firm",
    shortLabel: "Partnership",
    category: "corporate",
    description: "Traditional partnership under Indian Partnership Act 1932",
    regulators: ["roc", "cbd_t", "cbic"],
    taxRegime: "llp_flat",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "analyst", "viewer"],
    iconEmoji: "👥",
  },
  proprietorship: {
    type: "proprietorship",
    label: "Proprietorship",
    shortLabel: "Prop.",
    category: "corporate",
    description: "Sole proprietorship; taxed at individual slab rates",
    regulators: ["cbd_t", "cbic"],
    taxRegime: "proprietorship_slab",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "viewer"],
    iconEmoji: "👤",
  },
  bank: {
    type: "bank",
    label: "Commercial Bank",
    shortLabel: "Bank",
    category: "financial",
    description: "RBI-regulated commercial bank (PSU or private)",
    regulators: ["rbi", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: true,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏦",
  },
  nbfc: {
    type: "nbfc",
    label: "Non-Banking Financial Company",
    shortLabel: "NBFC",
    category: "financial",
    description: "RBI-regulated NBFC; subject to Master Directions",
    regulators: ["rbi", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "💳",
  },
  insurance_company: {
    type: "insurance_company",
    label: "Insurance Company",
    shortLabel: "Insurance",
    category: "financial",
    description: "IRDAI-regulated insurer (life, general, or health)",
    regulators: ["irdai", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: true,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🛡️",
  },
  psu: {
    type: "psu",
    label: "Public Sector Undertaking",
    shortLabel: "PSU",
    category: "government",
    description: "Government-owned commercial entity (e.g., ONGC, NTPC)",
    regulators: ["mca", "cbd_t", "cbic", "sebi"],
    taxRegime: "cit_default",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏭",
  },
  government_dept: {
    type: "government_dept",
    label: "Government Department",
    shortLabel: "Govt Dept",
    category: "government",
    description: "Central or State government ministry/department",
    regulators: ["cbd_t", "cbic"],
    taxRegime: "exempt_govt",
    gstApplicable: false, // RCM on procurement
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: false,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "🏛️",
  },
  local_authority: {
    type: "local_authority",
    label: "Local Authority",
    shortLabel: "Local Auth",
    category: "government",
    description: "Municipal Corporation, Panchayat, or similar local body",
    regulators: ["cbd_t", "cbic"],
    taxRegime: "exempt_local_authority",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: false,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "🏙️",
  },
  university_govt: {
    type: "university_govt",
    label: "Government University",
    shortLabel: "Govt Univ",
    category: "education",
    description: "Government-funded university (IIT, IIM, NIT)",
    regulators: ["ugc", "aicte", "cbd_t"],
    taxRegime: "trust_12ab",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "🎓",
  },
  university_private: {
    type: "university_private",
    label: "Private University",
    shortLabel: "Pvt Univ",
    category: "education",
    description: "Private university; taxed as company",
    regulators: ["ugc", "aicte", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏫",
  },
  school: {
    type: "school",
    label: "School (K-12)",
    shortLabel: "School",
    category: "education",
    description: "Pre-primary, primary, or secondary school",
    regulators: ["cbd_t"],
    taxRegime: "trust_12ab",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "viewer"],
    iconEmoji: "📚",
  },
  trust_ngo: {
    type: "trust_ngo",
    label: "Trust / NGO",
    shortLabel: "Trust",
    category: "non_profit",
    description: "Charitable or religious trust registered under 12A/12AB",
    regulators: ["registrar_trusts", "cbd_t"],
    taxRegime: "trust_12ab",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: false,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "🤲",
  },
  section_8_company: {
    type: "section_8_company",
    label: "Section 8 Company",
    shortLabel: "Sec 8 Co",
    category: "non_profit",
    description: "Non-profit company under Section 8 of Companies Act",
    regulators: ["mca", "roc", "cbd_t"],
    taxRegime: "trust_12ab",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: false,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "🙏",
  },
  cooperative_society: {
    type: "cooperative_society",
    label: "Cooperative Society",
    shortLabel: "Co-op",
    category: "other",
    description: "Cooperative society (co-op bank, milk union, etc.)",
    regulators: ["registrar_societies", "cbd_t", "cbic"],
    taxRegime: "coop_slab",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "auditor", "viewer"],
    iconEmoji: "♻️",
  },
  huf: {
    type: "huf",
    label: "Hindu Undivided Family",
    shortLabel: "HUF",
    category: "other",
    description: "HUF with kartha as manager; taxed at individual slab rates",
    regulators: ["cbd_t"],
    taxRegime: "huf_slab",
    gstApplicable: false,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "viewer"],
    iconEmoji: "🕉️",
  },
  society_club: {
    type: "society_club",
    label: "Society / Club",
    shortLabel: "Society",
    category: "other",
    description: "Housing society, club, or association",
    regulators: ["registrar_societies", "cbd_t", "cbic"],
    taxRegime: "cit_default",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "viewer"],
    iconEmoji: "🏘️",
  },
  ecommerce_operator: {
    type: "ecommerce_operator",
    label: "E-commerce Operator",
    shortLabel: "E-com Op",
    category: "corporate",
    description: "Online marketplace (Amazon, Flipkart, Meesho); TCS 0.5%",
    regulators: ["mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: true,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🛒",
  },
  manufacturing_unit: {
    type: "manufacturing_unit",
    label: "Manufacturing Unit",
    shortLabel: "Mfg Unit",
    category: "corporate",
    description: "Goods manufacturer; eligible for §115BAB if new",
    regulators: ["mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_mfg_115bab",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏭",
  },
  real_estate_developer: {
    type: "real_estate_developer",
    label: "Real Estate Developer",
    shortLabel: "RE Dev",
    category: "corporate",
    description: "RERA-registered developer; GST 1%/5% on residential",
    regulators: ["rera", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 5,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏗️",
  },
  it_ites_company: {
    type: "it_ites_company",
    label: "IT / ITES Company",
    shortLabel: "IT Co",
    category: "corporate",
    description: "IT/software/ITES company; SEZ zero-rated exports",
    regulators: ["stpi", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: true,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "💻",
  },
  fintech_pa: {
    type: "fintech_pa",
    label: "Fintech / Payment Aggregator",
    shortLabel: "Fintech",
    category: "financial",
    description: "RBI-licensed Payment Aggregator; GST 18% on MDR",
    regulators: ["rbi", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "📱",
  },
  healthcare_provider: {
    type: "healthcare_provider",
    label: "Healthcare Provider",
    shortLabel: "Hospital",
    category: "corporate",
    description: "Hospital, diagnostic chain; healthcare services GST-exempt",
    regulators: ["mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "🏥",
  },
  pharma_company: {
    type: "pharma_company",
    label: "Pharmaceutical Company",
    shortLabel: "Pharma",
    category: "corporate",
    description: "Drug manufacturer; NPPA price-controlled",
    regulators: ["nppa", "mca", "cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 12,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: true,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "auditor", "viewer"],
    iconEmoji: "💊",
  },
  agriculture_fpo: {
    type: "agriculture_fpo",
    label: "Farmer Producer Organisation",
    shortLabel: "FPO",
    category: "other",
    description: "FPO with 5-year tax exemption under 10(26AABR)",
    regulators: ["mca", "cbd_t", "cbic"],
    taxRegime: "trust_12ab",
    gstApplicable: true,
    gstDefaultRate: 0,
    tdsApplicable: true,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: false,
    defaultRoles: ["tenant_admin", "compliance_officer", "viewer"],
    iconEmoji: "🌾",
  },
  msme_small: {
    type: "msme_small",
    label: "MSME — Small",
    shortLabel: "MSME-S",
    category: "msme",
    description: "Udyam-registered small enterprise (investment ≤₹10 Cr / turnover ≤₹50 Cr)",
    regulators: ["cbd_t", "cbic"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "analyst", "viewer"],
    iconEmoji: "🏭",
    turnoverThresholdMsme: "small",
  },
  msme_micro: {
    type: "msme_micro",
    label: "MSME — Micro",
    shortLabel: "MSME-M",
    category: "msme",
    description: "Udyam-registered micro enterprise (investment ≤₹1 Cr / turnover ≤₹5 Cr)",
    regulators: ["cbd_t", "cbic"],
    taxRegime: "proprietorship_slab",
    gstApplicable: false, // below threshold
    gstDefaultRate: 0,
    tdsApplicable: false,
    tcsApplicable: false,
    csrApplicable: false,
    matApplicable: false,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: false,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "viewer"],
    iconEmoji: "🏪",
    turnoverThresholdMsme: "micro",
  },
  msme_medium: {
    type: "msme_medium",
    label: "MSME — Medium",
    shortLabel: "MSME-Med",
    category: "msme",
    description: "Udyam-registered medium enterprise (investment ≤₹50 Cr / turnover ≤₹250 Cr)",
    regulators: ["cbd_t", "cbic", "mca"],
    taxRegime: "cit_new_115baa",
    gstApplicable: true,
    gstDefaultRate: 18,
    tdsApplicable: true,
    tcsApplicable: true,
    csrApplicable: false,
    matApplicable: true,
    transferPricingRisk: false,
    equalisationLevyRisk: false,
    stampDutyApplicable: true,
    professionalTaxApplicable: true,
    defaultRoles: ["tenant_admin", "compliance_officer", "analyst", "viewer"],
    iconEmoji: "🏭",
    turnoverThresholdMsme: "medium",
  },
};

/**
 * Group entity types by category for UI display.
 */
export const ENTITY_CATEGORIES: Array<{
  id: string;
  label: string;
  description: string;
  types: EntityType[];
}> = [
  {
    id: "corporate",
    label: "Corporate & Commercial",
    description: "Companies, partnerships, and proprietary businesses",
    types: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "manufacturing_unit", "it_ites_company", "ecommerce_operator", "real_estate_developer", "healthcare_provider", "pharma_company"],
  },
  {
    id: "financial",
    label: "Financial Services",
    description: "Regulated financial institutions",
    types: ["bank", "nbfc", "insurance_company", "fintech_pa"],
  },
  {
    id: "government",
    label: "Government & PSU",
    description: "Government departments and public sector undertakings",
    types: ["government_dept", "local_authority", "psu"],
  },
  {
    id: "education",
    label: "Education",
    description: "Universities, colleges, and schools",
    types: ["university_govt", "university_private", "school"],
  },
  {
    id: "non_profit",
    label: "Non-Profit & Trust",
    description: "Charitable trusts, NGOs, Section 8 companies",
    types: ["trust_ngo", "section_8_company", "agriculture_fpo"],
  },
  {
    id: "msme",
    label: "MSME",
    description: "Micro, Small, and Medium Enterprises (Udyam-registered)",
    types: ["msme_micro", "msme_small", "msme_medium"],
  },
  {
    id: "other",
    label: "Other Entities",
    description: "Cooperatives, HUFs, societies, and clubs",
    types: ["cooperative_society", "huf", "society_club"],
  },
];

/**
 * Get an entity type definition.
 */
export function getEntityTypeDef(type: EntityType): EntityTypeDef {
  return ENTITY_TYPES[type];
}

/**
 * Check if an entity type is exempt from income tax.
 */
export function isIncomeTaxExempt(type: EntityType): boolean {
  const def = ENTITY_TYPES[type];
  return def.taxRegime === "exempt_govt" || def.taxRegime === "exempt_local_authority";
}
