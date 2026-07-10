/**
 * Compliance Configuration
 * ------------------------
 * Central registry of compliance frameworks, certifications, and controls.
 * Used by the compliance dashboard and audit trail.
 */

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  mandatory: boolean;
  status: "not_started" | "in_progress" | "certified" | "expired";
  certifyingBody?: string;
  certificateExpiry?: string;
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  description: string;
  category: string;
  status: "not_implemented" | "implemented" | "verified" | "failed";
  evidence?: string;
  lastTested?: string;
}

export const COMPLIANCE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: "soc2_type2",
    name: "SOC 2 Type II",
    description: "AICPA Service Organization Control 2 — Security, Availability, Processing Integrity, Confidentiality, Privacy",
    jurisdiction: "Global",
    mandatory: false,
    status: "in_progress",
    certifyingBody: "AICPA-licensed CPA firm",
    controls: [
      { id: "CC1", description: "Control Environment", category: "Common Criteria", status: "implemented" },
      { id: "CC2", description: "Communication and Information", category: "Common Criteria", status: "implemented" },
      { id: "CC3", description: "Risk Assessment", category: "Common Criteria", status: "implemented" },
      { id: "CC4", description: "Monitoring Activities", category: "Common Criteria", status: "implemented" },
      { id: "CC5", description: "Control Activities", category: "Common Criteria", status: "implemented" },
      { id: "CC6.1", description: "Logical and Physical Access Controls", category: "Common Criteria", status: "implemented" },
      { id: "CC6.2", description: "User Authentication", category: "Common Criteria", status: "implemented" },
      { id: "CC6.3", description: "Authorization Controls", category: "Common Criteria", status: "implemented" },
      { id: "CC6.4", description: "Encryption at Rest", category: "Common Criteria", status: "implemented" },
      { id: "CC6.5", description: "Encryption in Transit", category: "Common Criteria", status: "implemented" },
      { id: "CC6.6", description: "Network Security", category: "Common Criteria", status: "implemented" },
      { id: "CC7.1", description: "Vulnerability Detection", category: "Common Criteria", status: "implemented" },
      { id: "CC7.2", description: "Incident Detection and Response", category: "Common Criteria", status: "implemented" },
      { id: "CC7.3", description: "Recovery from Incidents", category: "Common Criteria", status: "implemented" },
      { id: "CC8", description: "Change Management", category: "Common Criteria", status: "implemented" },
      { id: "CC9", description: "Risk Mitigation", category: "Common Criteria", status: "implemented" },
      { id: "A1.1", description: "Capacity Management", category: "Availability", status: "implemented" },
      { id: "A1.2", description: "Environmental Protections", category: "Availability", status: "implemented" },
      { id: "A1.3", description: "Backup and Recovery", category: "Availability", status: "implemented" },
      { id: "C1.1", description: "Confidentiality Controls", category: "Confidentiality", status: "implemented" },
      { id: "P1.1", description: "PII Inventory", category: "Privacy", status: "implemented" },
      { id: "P2.1", description: "Privacy Policy", category: "Privacy", status: "implemented" },
      { id: "P3.1", description: "Consent Management", category: "Privacy", status: "implemented" },
      { id: "P4.1", description: "Data Subject Rights", category: "Privacy", status: "implemented" },
      { id: "P5.1", description: "Data Retention and Disposal", category: "Privacy", status: "implemented" },
      { id: "P6.1", description: "Data Quality", category: "Privacy", status: "implemented" },
      { id: "P7.1", description: "Privacy Monitoring", category: "Privacy", status: "implemented" },
    ],
  },
  {
    id: "iso27001",
    name: "ISO/IEC 27001:2022",
    description: "Information Security Management System (ISMS)",
    jurisdiction: "Global",
    mandatory: false,
    status: "in_progress",
    certifyingBody: "Accredited certification body (BSI, DNV, etc.)",
    controls: [
      { id: "A.5.1", description: "Information Security Policies", category: "Organizational", status: "implemented" },
      { id: "A.5.2", description: "Information Security Roles and Responsibilities", category: "Organizational", status: "implemented" },
      { id: "A.5.3", description: "Segregation of Duties", category: "Organizational", status: "implemented" },
      { id: "A.5.4", description: "Management Responsibilities", category: "Organizational", status: "implemented" },
      { id: "A.5.5", description: "Contact with Authorities", category: "Organizational", status: "implemented" },
      { id: "A.5.6", description: "Contact with Special Interest Groups", category: "Organizational", status: "implemented" },
      { id: "A.5.7", description: "Threat Intelligence", category: "Organizational", status: "implemented" },
      { id: "A.5.8", description: "Information Security in Project Management", category: "Organizational", status: "implemented" },
      { id: "A.5.9", description: "Inventory of Assets", category: "Organizational", status: "implemented" },
      { id: "A.5.10", description: "Acceptable Use of Assets", category: "Organizational", status: "implemented" },
      { id: "A.6.1", description: "Screening", category: "People", status: "implemented" },
      { id: "A.6.2", description: "Terms and Conditions of Employment", category: "People", status: "implemented" },
      { id: "A.6.3", description: "Information Security Awareness, Education, and Training", category: "People", status: "implemented" },
      { id: "A.7.1", description: "Physical Security Perimeters", category: "Physical", status: "implemented" },
      { id: "A.7.2", description: "Physical Entry", category: "Physical", status: "implemented" },
      { id: "A.8.1", description: "User Endpoint Devices", category: "Technological", status: "implemented" },
      { id: "A.8.2", description: "Privileged Access Rights", category: "Technological", status: "implemented" },
      { id: "A.8.3", description: "Information Access Restriction", category: "Technological", status: "implemented" },
      { id: "A.8.4", description: "Access to Source Code", category: "Technological", status: "implemented" },
      { id: "A.8.5", description: "Secure Authentication", category: "Technological", status: "implemented" },
      { id: "A.8.6", description: "Capacity Management", category: "Technological", status: "implemented" },
      { id: "A.8.7", description: "Protection Against Malware", category: "Technological", status: "implemented" },
      { id: "A.8.8", description: "Management of Technical Vulnerabilities", category: "Technological", status: "implemented" },
      { id: "A.8.9", description: "Configuration Management", category: "Technological", status: "implemented" },
      { id: "A.8.10", description: "Information Deletion", category: "Technological", status: "implemented" },
      { id: "A.8.11", description: "Data Masking", category: "Technological", status: "implemented" },
      { id: "A.8.12", description: "Data Leakage Prevention", category: "Technological", status: "implemented" },
      { id: "A.8.13", description: "Backup", category: "Technological", status: "implemented" },
      { id: "A.8.14", description: "Redundancy of Information Processing Facilities", category: "Technological", status: "implemented" },
      { id: "A.8.15", description: "Logging", category: "Technological", status: "implemented" },
      { id: "A.8.16", description: "Monitoring Activities", category: "Technological", status: "implemented" },
      { id: "A.8.17", description: "Clock Synchronization", category: "Technological", status: "implemented" },
      { id: "A.8.18", description: "Use of Privileged Utility Programs", category: "Technological", status: "implemented" },
      { id: "A.8.19", description: "Installation of Software on Operational Systems", category: "Technological", status: "implemented" },
      { id: "A.8.20", description: "Networks Security", category: "Technological", status: "implemented" },
      { id: "A.8.21", description: "Security of Network Services", category: "Technological", status: "implemented" },
      { id: "A.8.22", description: "Segregation of Networks", category: "Technological", status: "implemented" },
      { id: "A.8.23", description: "Web Filtering", category: "Technological", status: "implemented" },
      { id: "A.8.24", description: "Use of Cryptography", category: "Technological", status: "implemented" },
      { id: "A.8.25", description: "Secure Development Lifecycle", category: "Technological", status: "implemented" },
      { id: "A.8.26", description: "Application Security Requirements", category: "Technological", status: "implemented" },
      { id: "A.8.27", description: "Secure System Architecture and Engineering Principles", category: "Technological", status: "implemented" },
      { id: "A.8.28", description: "Secure Coding", category: "Technological", status: "implemented" },
      { id: "A.8.29", description: "Security Testing in Development and Acceptance", category: "Technological", status: "implemented" },
      { id: "A.8.30", description: "Outsourced Development", category: "Technological", status: "implemented" },
      { id: "A.8.31", description: "Separation of Development, Test, and Production Environments", category: "Technological", status: "implemented" },
      { id: "A.8.32", description: "Change Management", category: "Technological", status: "implemented" },
      { id: "A.8.33", description: "Test Information", category: "Technological", status: "implemented" },
      { id: "A.8.34", description: "Protection of Information Systems During Audit Testing", category: "Technological", status: "implemented" },
    ],
  },
  {
    id: "dpdp_2023",
    name: "DPDP Act 2023 (India)",
    description: "Digital Personal Data Protection Act, 2023 — India's comprehensive data protection law",
    jurisdiction: "India",
    mandatory: true,
    status: "certified",
    controls: [
      { id: "s4", description: "Consent for processing personal data", category: "Obligations", status: "implemented" },
      { id: "s7", description: "Legitimate uses of personal data", category: "Obligations", status: "implemented" },
      { id: "s8", description: "Data Principal rights (access, correction, erasure, grievance)", category: "Rights", status: "implemented" },
      { id: "s11", description: "Notice to Data Principal", category: "Obligations", status: "implemented" },
      { id: "s12", description: "Right of access to personal data", category: "Rights", status: "implemented" },
      { id: "s13", description: "Right to correction and erasure", category: "Rights", status: "implemented" },
      { id: "s14", description: "Right to grievance redressal", category: "Rights", status: "implemented" },
      { id: "s15", description: "Right to nominate", category: "Rights", status: "implemented" },
      { id: "s17", description: "Data localization (cross-border transfer restrictions)", category: "Transfer", status: "implemented" },
      { id: "s25", description: "Security safeguards (breach notification within 72 hours)", category: "Security", status: "implemented" },
    ],
  },
  {
    id: "rbi_outsourcing",
    name: "RBI Master Direction on Outsourcing of IT Services",
    description: "Reserve Bank of India — IT outsourcing requirements for regulated entities",
    jurisdiction: "India",
    mandatory: true,
    status: "certified",
    controls: [
      { id: "5.1", description: "Outsourcing Risk Management Framework", category: "Governance", status: "implemented" },
      { id: "6.1", description: "Due diligence on service provider", category: "Pre-contract", status: "implemented" },
      { id: "7.1", description: "Written contract with mandatory clauses", category: "Contract", status: "implemented" },
      { id: "8.1", description: "Access to books and accounts by RE/RBI", category: "Audit", status: "implemented" },
      { id: "9.1", description: "Confidentiality of customer information", category: "Data", status: "implemented" },
      { id: "10.1", description: "Business Continuity and Disaster Recovery", category: "Resilience", status: "implemented" },
      { id: "11.1", description: "Cross-border outsourcing restrictions", category: "Transfer", status: "implemented" },
      { id: "12.1", description: "Monitoring and control of outsourcing", category: "Ongoing", status: "implemented" },
      { id: "13.1", description: "Data localization (customer data must stay in India)", category: "Data", status: "implemented" },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR (EU)",
    description: "General Data Protection Regulation — European Union",
    jurisdiction: "EU",
    mandatory: false,
    status: "certified",
    controls: [
      { id: "art6", description: "Lawful basis for processing", category: "Principles", status: "implemented" },
      { id: "art7", description: "Conditions for consent", category: "Consent", status: "implemented" },
      { id: "art8", description: "Child's consent (under 16)", category: "Consent", status: "implemented" },
      { id: "art9", description: "Special categories of personal data", category: "Principles", status: "implemented" },
      { id: "art12", description: "Transparent information, communication, modalities", category: "Transparency", status: "implemented" },
      { id: "art13", description: "Information to be provided (collected from subject)", category: "Transparency", status: "implemented" },
      { id: "art14", description: "Information to be provided (not from subject)", category: "Transparency", status: "implemented" },
      { id: "art15", description: "Right of access", category: "Rights", status: "implemented" },
      { id: "art16", description: "Right to rectification", category: "Rights", status: "implemented" },
      { id: "art17", description: "Right to erasure (right to be forgotten)", category: "Rights", status: "implemented" },
      { id: "art18", description: "Right to restriction of processing", category: "Rights", status: "implemented" },
      { id: "art19", description: "Notification obligation", category: "Rights", status: "implemented" },
      { id: "art20", description: "Right to data portability", category: "Rights", status: "implemented" },
      { id: "art21", description: "Right to object", category: "Rights", status: "implemented" },
      { id: "art22", description: "Automated decision-making", category: "Rights", status: "implemented" },
      { id: "art25", description: "Data protection by design and by default", category: "Principles", status: "implemented" },
      { id: "art28", description: "Processor obligations", category: "Processors", status: "implemented" },
      { id: "art30", description: "Records of processing activities", category: "Accountability", status: "implemented" },
      { id: "art32", description: "Security of processing", category: "Security", status: "implemented" },
      { id: "art33", description: "Breach notification (72 hours)", category: "Breach", status: "implemented" },
      { id: "art34", description: "Communication of breach to subject", category: "Breach", status: "implemented" },
      { id: "art35", description: "Data Protection Impact Assessment (DPIA)", category: "Accountability", status: "implemented" },
      { id: "art44", description: "Cross-border transfers (SCCs, adequacy)", category: "Transfer", status: "implemented" },
    ],
  },
  {
    id: "iso27017",
    name: "ISO/IEC 27017:2015",
    description: "Code of practice for information security controls based on ISO/IEC 27002 for cloud services",
    jurisdiction: "Global",
    mandatory: false,
    status: "in_progress",
    controls: [
      { id: "A.10.1.1", description: "Shared responsibilities in cloud", category: "Cloud", status: "implemented" },
      { id: "A.10.1.2", description: "Customer separation in cloud", category: "Cloud", status: "implemented" },
      { id: "A.10.1.3", description: "Virtual environment security", category: "Cloud", status: "implemented" },
    ],
  },
  {
    id: "iso27018",
    name: "ISO/IEC 27018:2019",
    description: "Code of practice for protection of personally identifiable information (PII) in public clouds",
    jurisdiction: "Global",
    mandatory: false,
    status: "in_progress",
    controls: [
      { id: "A.7.2.1", description: "PII processor agreement", category: "PII", status: "implemented" },
      { id: "A.9.1.1", description: "Access to PII restricted", category: "PII", status: "implemented" },
      { id: "A.11.1.2", description: "PII returned at end of contract", category: "PII", status: "implemented" },
    ],
  },
  {
    id: "pci_dss",
    name: "PCI DSS v4.0",
    description: "Payment Card Industry Data Security Standard (if handling card data)",
    jurisdiction: "Global",
    mandatory: false,
    status: "not_started",
    controls: [],
  },
];

/**
 * Get a compliance framework by ID.
 */
export function getFramework(id: string): ComplianceFramework | undefined {
  return COMPLIANCE_FRAMEWORKS.find((f) => f.id === id);
}

/**
 * Get the compliance dashboard summary.
 */
export function getComplianceSummary() {
  return COMPLIANCE_FRAMEWORKS.map((f) => {
    const totalControls = f.controls.length;
    const implemented = f.controls.filter((c) => c.status === "implemented" || c.status === "verified").length;
    return {
      id: f.id,
      name: f.name,
      jurisdiction: f.jurisdiction,
      mandatory: f.mandatory,
      status: f.status,
      progress: totalControls > 0 ? Math.round((implemented / totalControls) * 100) : 0,
      totalControls,
      implementedControls: implemented,
    };
  });
}
