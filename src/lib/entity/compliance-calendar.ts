/**
 * Entity Compliance Calendar
 * --------------------------
 * Generates the filing schedule for any entity type based on:
 *   - Entity type (determines which returns apply)
 *   - Turnover tier (determines GST return frequency)
 *   - State of registration (Professional Tax, Stamp Duty)
 *
 * Output: List of filings with due dates, frequency, penalty, and form name.
 *
 * Source: research/business-portal/BUSINESS_PORTAL_RESEARCH.md §4.3
 */

import { EntityType, getEntityTypeDef } from "./types";

export type FilingFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "annual" | "on-event";

export interface ComplianceFiling {
  id: string;
  name: string;
  form: string;
  frequency: FilingFrequency;
  dueDatePattern: string; // human-readable
  statutoryBody: string;  // CBDT, CBIC, MCA, RBI, etc.
  penalty: string;
  appliesTo: EntityType[];
  priority: "critical" | "high" | "medium" | "low";
  description: string;
}

/**
 * Master filing registry — all returns that may apply to entities.
 */
export const ALL_FILINGS: ComplianceFiling[] = [
  // ============== Income Tax ==============
  {
    id: "itr-6",
    name: "Income Tax Return (Companies)",
    form: "ITR-6",
    frequency: "annual",
    dueDatePattern: "31st October (audit cases) / 31st July (non-audit)",
    statutoryBody: "CBDT",
    penalty: "₹10,000 (₹1,000 if income < ₹5L); 1% per month interest u/s 234A",
    appliesTo: ["private_limited", "public_limited", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Annual income tax return for companies",
  },
  {
    id: "itr-5",
    name: "Income Tax Return (LLP/Firm/AOP/Co-op)",
    form: "ITR-5",
    frequency: "annual",
    dueDatePattern: "31st October (audit cases) / 31st July (non-audit)",
    statutoryBody: "CBDT",
    penalty: "₹10,000 (₹1,000 if income < ₹5L); 1% per month interest u/s 234A",
    appliesTo: ["llp", "partnership_firm", "cooperative_society", "society_club", "section_8_company"],
    priority: "critical",
    description: "Annual income tax return for LLPs, firms, AOPs, co-ops",
  },
  {
    id: "itr-7",
    name: "Income Tax Return (Trusts/Universities/Charitable)",
    form: "ITR-7",
    frequency: "annual",
    dueDatePattern: "31st October",
    statutoryBody: "CBDT",
    penalty: "₹10,000; loss of exemption if not filed",
    appliesTo: ["trust_ngo", "section_8_company", "university_govt", "school", "agriculture_fpo"],
    priority: "critical",
    description: "Annual return for trusts, universities, charitable institutions under Section 139(4A)",
  },
  {
    id: "itr-3",
    name: "Income Tax Return (Proprietorship/HUF)",
    form: "ITR-3",
    frequency: "annual",
    dueDatePattern: "31st October (audit) / 31st July (non-audit)",
    statutoryBody: "CBDT",
    penalty: "₹10,000 (₹1,000 if income < ₹5L)",
    appliesTo: ["proprietorship", "huf", "msme_micro"],
    priority: "critical",
    description: "Annual return for individuals/HUFs having business income",
  },
  {
    id: "advance-tax",
    name: "Advance Tax Instalments",
    form: "Challan 280",
    frequency: "quarterly",
    dueDatePattern: "15% by 15 Jun, 45% by 15 Sep, 75% by 15 Dec, 100% by 15 Mar",
    statutoryBody: "CBDT",
    penalty: "Interest u/s 234B (1% per month on shortfall) and 234C",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "huf", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Quarterly advance tax payment (15/45/75/100% of estimated tax)",
  },
  {
    id: "tax-audit",
    name: "Tax Audit Report (Section 44AB)",
    form: "Form 3CA/3CB + 3CD",
    frequency: "annual",
    dueDatePattern: "30th September (before ITR filing)",
    statutoryBody: "CBDT",
    penalty: "0.5% of turnover, max ₹1,50,000",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Mandatory tax audit for turnover > ₹1 Cr (₹10 Cr if digital) or profession > ₹50 L",
  },
  {
    id: "tp-report",
    name: "Transfer Pricing Report (Form 3CEB)",
    form: "Form 3CEB",
    frequency: "annual",
    dueDatePattern: "30th November",
    statutoryBody: "CBDT",
    penalty: "2% of international transaction value",
    appliesTo: ["public_limited", "bank", "insurance_company", "ecommerce_operator", "it_ites_company"],
    priority: "critical",
    description: "Transfer pricing certificate for entities with international/related-party transactions",
  },
  {
    id: "form-10b",
    name: "Trust Audit Report (Form 10B/10BB)",
    form: "Form 10B",
    frequency: "annual",
    dueDatePattern: "Before ITR-7 filing (31st October)",
    statutoryBody: "CBDT",
    penalty: "Loss of exemption under Section 11",
    appliesTo: ["trust_ngo", "section_8_company", "university_govt", "school", "agriculture_fpo"],
    priority: "critical",
    description: "Audit report for trusts/charitable institutions under Section 12A(4)(b)",
  },

  // ============== GST ==============
  {
    id: "gstr-1",
    name: "GSTR-1 (Outward Supplies)",
    form: "GSTR-1",
    frequency: "monthly",
    dueDatePattern: "11th of next month (turnover > ₹1.5 Cr) / quarterly (turnover ≤ ₹5 Cr with QRMP)",
    statutoryBody: "CBIC",
    penalty: "₹200/day (₹100 CGST + ₹100 SGST), max ₹5,000; 18% interest on late tax",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Details of outward supplies (sales) — auto-populates GSTR-2B for buyers",
  },
  {
    id: "gstr-3b",
    name: "GSTR-3B (Monthly Summary Return)",
    form: "GSTR-3B",
    frequency: "monthly",
    dueDatePattern: "20th of next month (turnover > ₹5 Cr) / 22nd or 24th (QRMP, turnover ≤ ₹5 Cr)",
    statutoryBody: "CBIC",
    penalty: "₹200/day, max 0.25% of turnover; 18% interest on late tax",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Monthly summary return with tax payment",
  },
  {
    id: "gstr-9",
    name: "GSTR-9 (Annual Return)",
    form: "GSTR-9",
    frequency: "annual",
    dueDatePattern: "31st December of next financial year",
    statutoryBody: "CBIC",
    penalty: "₹200/day, max 0.25% of turnover",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "high",
    description: "Annual GST return (mandatory for turnover > ₹2 Cr)",
  },
  {
    id: "gstr-9c",
    name: "GSTR-9C (Reconciliation Statement)",
    form: "GSTR-9C",
    frequency: "annual",
    dueDatePattern: "31st December of next financial year",
    statutoryBody: "CBIC",
    penalty: "₹200/day, max 0.25% of turnover",
    appliesTo: ["private_limited", "public_limited", "bank", "nbfc", "insurance_company", "psu", "university_private", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_medium"],
    priority: "high",
    description: "Self-certified reconciliation of GSTR-9 with audited financials (mandatory for turnover > ₹5 Cr)",
  },
  {
    id: "gstr-8",
    name: "GSTR-8 (E-commerce TCS Return)",
    form: "GSTR-8",
    frequency: "monthly",
    dueDatePattern: "10th of next month",
    statutoryBody: "CBIC",
    penalty: "₹200/day, max ₹5,000; 18% interest",
    appliesTo: ["ecommerce_operator"],
    priority: "critical",
    description: "TCS return for e-commerce operators (0.5% TCS on seller payouts)",
  },
  {
    id: "e-invoice",
    name: "E-Invoicing (IRN/QR)",
    form: "IRN via NIC API",
    frequency: "on-event",
    dueDatePattern: "Real-time (per invoice)",
    statutoryBody: "CBIC",
    penalty: "Invoice invalid for ITC; ₹25,000 per invoice",
    appliesTo: ["private_limited", "public_limited", "llp", "bank", "nbfc", "insurance_company", "psu", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_medium"],
    priority: "critical",
    description: "Mandatory e-invoicing for turnover > ₹5 Cr (since Aug 2023)",
  },
  {
    id: "e-way-bill",
    name: "E-Way Bill",
    form: "EWB-01",
    frequency: "on-event",
    dueDatePattern: "Before movement of goods > ₹50,000",
    statutoryBody: "CBIC",
    penalty: "₹10,000 or tax amount (whichever higher) + seizure of goods",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "pharma_company", "msme_small", "msme_medium"],
    priority: "high",
    description: "E-way bill for inter-state movement of goods > ₹50,000",
  },

  // ============== TDS/TCS ==============
  {
    id: "tds-deposit",
    name: "TDS Deposit",
    form: "Challan 281",
    frequency: "monthly",
    dueDatePattern: "7th of next month (same day for govt deductors)",
    statutoryBody: "CBDT",
    penalty: "1.5% per month interest u/s 201(1A); penalty u/s 221",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "bank", "nbfc", "insurance_company", "psu", "government_dept", "local_authority", "university_govt", "university_private", "school", "trust_ngo", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "huf", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Monthly deposit of TDS deducted under sections 192-194S",
  },
  {
    id: "tds-return-24q",
    name: "TDS Return — Salary (24Q)",
    form: "Form 24Q",
    frequency: "quarterly",
    dueDatePattern: "31st Jul / 31st Oct / 31st Jan / 31st May",
    statutoryBody: "CBDT",
    penalty: "₹200/day (Sec 234E), max TDS amount; ₹10,000-1,00,000 (Sec 271H)",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "bank", "nbfc", "insurance_company", "psu", "government_dept", "local_authority", "university_govt", "university_private", "school", "trust_ngo", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Quarterly TDS return for salary (Section 192) deductions",
  },
  {
    id: "tds-return-26q",
    name: "TDS Return — Non-Salary (26Q)",
    form: "Form 26Q",
    frequency: "quarterly",
    dueDatePattern: "31st Jul / 31st Oct / 31st Jan / 31st May",
    statutoryBody: "CBDT",
    penalty: "₹200/day (Sec 234E), max TDS amount; ₹10,000-1,00,000 (Sec 271H)",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "bank", "nbfc", "insurance_company", "psu", "government_dept", "local_authority", "university_govt", "university_private", "school", "trust_ngo", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "society_club", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Quarterly TDS return for non-salary (Sections 194A-194S) deductions",
  },
  {
    id: "tcs-return-27eq",
    name: "TCS Return (27EQ)",
    form: "Form 27EQ",
    frequency: "quarterly",
    dueDatePattern: "15th Jul / 15th Oct / 15th Jan / 15th May",
    statutoryBody: "CBDT",
    penalty: "₹200/day (Sec 234E); ₹10,000-1,00,000 (Sec 271H)",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "pharma_company", "msme_small", "msme_medium"],
    priority: "high",
    description: "Quarterly TCS return for tax collected at source (Section 206C)",
  },

  // ============== MCA (Companies Act) ==============
  {
    id: "mca-aoc4",
    name: "AOC-4 (Financial Statements)",
    form: "AOC-4",
    frequency: "annual",
    dueDatePattern: "30th October (within 30 days of AGM)",
    statutoryBody: "MCA",
    penalty: "₹100/day (Sec 450)",
    appliesTo: ["private_limited", "public_limited", "bank", "nbfc", "insurance_company", "psu", "university_private", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Filing of audited financial statements with ROC",
  },
  {
    id: "mca-mgt7",
    name: "MGT-7 (Annual Return)",
    form: "MGT-7",
    frequency: "annual",
    dueDatePattern: "29th November (within 60 days of AGM)",
    statutoryBody: "MCA",
    penalty: "₹100/day (Sec 450)",
    appliesTo: ["private_limited", "public_limited", "bank", "nbfc", "insurance_company", "psu", "university_private", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_small", "msme_medium"],
    priority: "critical",
    description: "Annual return of company under Section 92 of Companies Act",
  },
  {
    id: "mca-csr2",
    name: "CSR-2 (CSR Report)",
    form: "CSR-2",
    frequency: "annual",
    dueDatePattern: "31st March (FY end)",
    statutoryBody: "MCA",
    penalty: "₹10,000-1,00,000",
    appliesTo: ["public_limited", "bank", "nbfc", "insurance_company", "psu", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "healthcare_provider", "pharma_company"],
    priority: "high",
    description: "CSR report (Section 135) — for companies meeting net worth/turnover/profit thresholds",
  },
  {
    id: "mca-adt1",
    name: "ADT-1 (Auditor Appointment)",
    form: "ADT-1",
    frequency: "annual",
    dueDatePattern: "Within 15 days of AGM",
    statutoryBody: "MCA",
    penalty: "₹100/day",
    appliesTo: ["private_limited", "public_limited", "bank", "nbfc", "insurance_company", "psu", "university_private", "section_8_company", "ecommerce_operator", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "msme_small", "msme_medium"],
    priority: "medium",
    description: "Filing of auditor appointment with ROC",
  },

  // ============== Regulator-Specific ==============
  {
    id: "rbi-returns",
    name: "RBI Returns (Bank/NBFC)",
    form: "Multiple (X-Return, BS-Return, etc.)",
    frequency: "monthly",
    dueDatePattern: "Various — typically 5th-15th of next month",
    statutoryBody: "RBI",
    penalty: "Monetary penalty by RBI; supervisory action",
    appliesTo: ["bank", "nbfc", "fintech_pa"],
    priority: "critical",
    description: "RBI regulatory returns — capital adequacy, asset quality, liquidity, etc.",
  },
  {
    id: "irdai-returns",
    name: "IRDAI Returns",
    form: "Multiple",
    frequency: "quarterly",
    dueDatePattern: "Various — quarterly + annual",
    statutoryBody: "IRDAI",
    penalty: "Monetary penalty; license suspension",
    appliesTo: ["insurance_company"],
    priority: "critical",
    description: "IRDAI regulatory returns — solvency margin, financials, claim ratio",
  },
  {
    id: "rera-returns",
    name: "RERA Quarterly Returns",
    form: "RERA-QPR",
    frequency: "quarterly",
    dueDatePattern: "Last day of quarter end + 15 days",
    statutoryBody: "RERA",
    penalty: "₹50,000-5,00,000 per project",
    appliesTo: ["real_estate_developer"],
    priority: "high",
    description: "Quarterly progress report for each registered real estate project",
  },
  {
    id: "ugc-returns",
    name: "UGC Annual Returns",
    form: "UGC Annual Report",
    frequency: "annual",
    dueDatePattern: "30th September",
    statutoryBody: "UGC",
    penalty: "Loss of recognition/funding",
    appliesTo: ["university_govt", "university_private"],
    priority: "high",
    description: "UGC annual returns — academic, financial, infrastructure disclosure",
  },
  {
    id: "sebi-returns",
    name: "SEBI Quarterly Disclosures",
    form: "Multiple (Shareholding, CSR, RPT)",
    frequency: "quarterly",
    dueDatePattern: "Within 21 days of quarter end",
    statutoryBody: "SEBI",
    penalty: "₹1,00,000-1,00,00,000; suspension",
    appliesTo: ["public_limited", "bank", "psu"],
    priority: "critical",
    description: "SEBI LODR quarterly disclosures for listed companies",
  },

  // ============== Professional Tax ==============
  {
    id: "pt-return",
    name: "Professional Tax Return",
    form: "State-specific (e.g., Maharashtra PTRC)",
    frequency: "monthly",
    dueDatePattern: "Monthly/quarterly (varies by state)",
    statutoryBody: "State Commercial Tax",
    penalty: "₹1,000-2,000 + interest",
    appliesTo: ["private_limited", "public_limited", "llp", "partnership_firm", "proprietorship", "bank", "nbfc", "insurance_company", "psu", "university_private", "manufacturing_unit", "real_estate_developer", "it_ites_company", "fintech_pa", "healthcare_provider", "pharma_company", "cooperative_society", "huf", "society_club", "msme_small", "msme_medium"],
    priority: "medium",
    description: "Professional tax return (state-specific; not applicable in Delhi)",
  },
];

/**
 * Get all applicable filings for an entity type.
 */
export function getApplicableFilings(entityType: EntityType): ComplianceFiling[] {
  return ALL_FILINGS.filter((f) => f.appliesTo.includes(entityType));
}

/**
 * Generate a compliance calendar for the next 12 months.
 * Returns filings sorted by due date.
 */
export interface CalendarEntry {
  filing: ComplianceFiling;
  dueDate: Date;
  daysUntilDue: number;
  status: "overdue" | "due-soon" | "upcoming" | "scheduled";
}

export function generateComplianceCalendar(
  entityType: EntityType,
  startDate: Date = new Date(),
  monthsAhead: number = 12
): CalendarEntry[] {
  const filings = getApplicableFilings(entityType);
  const entries: CalendarEntry[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  for (const filing of filings) {
    // Generate next N occurrences of this filing within the date range
    const occurrences = generateOccurrences(filing, startDate, endDate);
    for (const dueDate of occurrences) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      let status: CalendarEntry["status"];
      if (daysUntilDue < 0) status = "overdue";
      else if (daysUntilDue <= 7) status = "due-soon";
      else if (daysUntilDue <= 30) status = "upcoming";
      else status = "scheduled";

      entries.push({ filing, dueDate, daysUntilDue, status });
    }
  }

  // Sort by due date
  entries.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return entries;
}

function generateOccurrences(
  filing: ComplianceFiling,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const next = computeNextDueDate(filing, current);
    if (next && next >= startDate && next <= endDate) {
      dates.push(new Date(next));
    }
    // Advance to next period
    switch (filing.frequency) {
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      case "quarterly":
        current.setMonth(current.getMonth() + 3);
        break;
      case "half-yearly":
        current.setMonth(current.getMonth() + 6);
        break;
      case "annual":
        current.setFullYear(current.getFullYear() + 1);
        break;
      case "on-event":
        // Skip — only triggered by events
        return dates;
      case "weekly":
      case "daily":
      default:
        return dates;
    }
  }

  return dates;
}

function computeNextDueDate(filing: ComplianceFiling, after: Date): Date | null {
  const d = new Date(after);

  switch (filing.id) {
    // Income tax
    case "itr-6":
    case "itr-5":
    case "itr-7":
    case "tax-audit":
    case "form-10b":
      // 31st October
      return nextDate(d, 9, 31); // October = month 9
    case "itr-3":
      // 31st July non-audit, 31st October audit
      return nextDate(d, 6, 31);
    case "tp-report":
      // 30th November
      return nextDate(d, 10, 30);
    case "advance-tax":
      // 15 Jun, 15 Sep, 15 Dec, 15 Mar
      return nextAdvanceTaxDate(d);

    // GST
    case "gstr-1":
      // 11th of next month
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 11);
    case "gstr-3b":
      // 20th of next month
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 20);
    case "gstr-9":
    case "gstr-9c":
      // 31st December of next FY (i.e., for FY 2024-25, due 31 Dec 2025)
      return new Date(d.getFullYear() + 1, 11, 31);
    case "gstr-8":
      // 10th of next month
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 10);
    case "e-invoice":
    case "e-way-bill":
      return null; // event-based

    // TDS
    case "tds-deposit":
      // 7th of next month
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 7);
    case "tds-return-24q":
    case "tds-return-26q":
      // 31 Jul, 31 Oct, 31 Jan, 31 May
      return nextQuarterEndDate(d);
    case "tcs-return-27eq":
      // 15 Jul, 15 Oct, 15 Jan, 15 May
      return nextTcsReturnDate(d);

    // MCA
    case "mca-aoc4":
      return nextDate(d, 9, 30); // 30 Oct
    case "mca-mgt7":
      return nextDate(d, 10, 29); // 29 Nov
    case "mca-csr2":
      return nextDate(d, 2, 31); // 31 Mar
    case "mca-adt1":
      // within 15 days of AGM (assume AGM 30 Sep)
      return nextDate(d, 9, 15); // 15 Oct

    // Regulator
    case "rbi-returns":
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 5);
    case "irdai-returns":
      return nextQuarterEndDate(d);
    case "rera-returns":
      return nextQuarterEndDate(d);
    case "ugc-returns":
      return nextDate(d, 8, 30); // 30 Sep
    case "sebi-returns":
      return nextQuarterEndDate(d);

    // PT
    case "pt-return":
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 15);

    default:
      return null;
  }
}

function nextDate(after: Date, month: number, day: number): Date {
  const year = after.getFullYear();
  let candidate = new Date(year, month, day);
  if (candidate < after) {
    candidate = new Date(year + 1, month, day);
  }
  return candidate;
}

function nextAdvanceTaxDate(after: Date): Date {
  const instalments = [
    { month: 5, day: 15 },  // 15 Jun
    { month: 8, day: 15 },  // 15 Sep
    { month: 11, day: 15 }, // 15 Dec
    { month: 2, day: 15 },  // 15 Mar (next year)
  ];
  for (const inst of instalments) {
    const year = inst.month === 2 ? after.getFullYear() + 1 : after.getFullYear();
    const candidate = new Date(year, inst.month, inst.day);
    if (candidate >= after) return candidate;
  }
  return new Date(after.getFullYear() + 1, 5, 15);
}

function nextQuarterEndDate(after: Date): Date {
  const qEnds = [
    { month: 5, day: 31 },  // Q1: 30 Jun, due 31 Jul
    { month: 8, day: 30 },  // Q2: 30 Sep, due 31 Oct
    { month: 11, day: 31 }, // Q3: 31 Dec, due 31 Jan
    { month: 2, day: 31 },  // Q4: 31 Mar, due 31 May
  ];
  for (const q of qEnds) {
    const year = q.month === 2 ? after.getFullYear() + 1 : after.getFullYear();
    const candidate = new Date(year, q.month, q.day);
    if (candidate >= after) return candidate;
  }
  return new Date(after.getFullYear() + 1, 5, 31);
}

function nextTcsReturnDate(after: Date): Date {
  const dates = [
    { month: 6, day: 15 },  // 15 Jul
    { month: 9, day: 15 },  // 15 Oct
    { month: 0, day: 15 },  // 15 Jan
    { month: 4, day: 15 },  // 15 May
  ];
  for (const d of dates) {
    const year = d.month === 0 ? after.getFullYear() + 1 : after.getFullYear();
    const candidate = new Date(year, d.month, d.day);
    if (candidate >= after) return candidate;
  }
  return new Date(after.getFullYear() + 1, 6, 15);
}

/**
 * Get the next N upcoming filings for an entity.
 */
export function getUpcomingFilings(
  entityType: EntityType,
  limit: number = 5
): CalendarEntry[] {
  const calendar = generateComplianceCalendar(entityType, new Date(), 3);
  return calendar
    .filter((e) => e.status !== "overdue")
    .slice(0, limit);
}

/**
 * Get overdue filings for an entity.
 */
export function getOverdueFilings(entityType: EntityType): CalendarEntry[] {
  const calendar = generateComplianceCalendar(entityType, new Date(), 1);
  return calendar.filter((e) => e.status === "overdue");
}
