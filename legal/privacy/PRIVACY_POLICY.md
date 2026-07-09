# Privacy Policy

**Effective Date:** January 1, 2025
**Version:** 2.0

## 1. Introduction

Artha AI Technologies Pvt. Ltd. ("Artha AI", "we", "us") is committed to protecting your privacy. This Privacy Policy describes how we collect, use, disclose, and protect your personal data when you use our wealth intelligence platform.

We comply with:
- **Digital Personal Data Protection Act, 2023 (India)** — DPDP Act
- **General Data Protection Regulation (GDPR)** — for EU data subjects
- **California Consumer Privacy Act (CCPA)** — for California residents
- **RBI Master Direction on Outsourcing of IT Services** — for regulated entities

## 2. Data Controller and Processor

- For **individual users**, Artha AI is the **Data Controller**.
- For **enterprise customers** (banks, NBFCs, CA firms), Artha AI is the **Data Processor** acting on instructions from the customer (who is the Controller).

## 3. Personal Data We Collect

### 3.1 Identity Data
- Name
- Email address
- Phone number
- Government IDs (PAN, Aadhaar) — only when you provide them for tax analysis
- Date of birth (optional, for tax computation)

### 3.2 Financial Data
- Bank account numbers (encrypted at rest)
- Transaction history (from uploaded statements)
- Income records
- Investment portfolio data
- Tax-related documents (Form 16, AIS, etc.)
- Loan and liability information

### 3.3 Usage Data
- IP address
- Device and browser information
- Usage patterns and feature engagement
- Audit trail (actions taken in the platform)

### 3.4 Sensitive Personal Data (Special Category)
Under GDPR Art. 9 and DPDP Act, certain data is "sensitive":
- Financial data (reveals economic situation)
- Biometric data (if collected for authentication)
- Health data (not collected)

**We do not collect data about children under 18.**

## 4. Lawful Basis for Processing (GDPR Art. 6)

| Purpose | Lawful Basis | DPDP Act Basis |
|---------|--------------|----------------|
| Provide the wealth intelligence service | Contract (Art. 6(1)(b)) | Consent |
| Tax computation and analysis | Legal obligation (Art. 6(1)(c)) | Legitimate use |
| Fraud detection and prevention | Legitimate interest (Art. 6(1)(f)) | Legitimate use |
| Compliance with regulatory requirements | Legal obligation (Art. 6(1)(c)) | Legitimate use |
| Product improvement (anonymized) | Consent (Art. 6(1)(a)) | Consent |
| Marketing communications | Consent (Art. 6(1)(a)) | Consent |
| AI model training (anonymized) | Consent (Art. 6(1)(a)) | Consent |

## 5. How We Use Your Data

### 5.1 Core Service
- Process uploaded financial documents
- Compute tax estimates
- Generate financial health scores
- Provide portfolio analysis
- Detect missing documents and mismatches

### 5.2 Security and Fraud Prevention
- Detect unauthorized access
- Prevent fraudulent transactions
- Maintain audit trail for non-repudiation
- Monitor for suspicious activity

### 5.3 Compliance
- Maintain records per RBI (7 years)
- Comply with tax authority requests when legally required
- Cooperate with law enforcement when compelled by valid legal process

### 5.4 Analytics (Anonymized)
- Aggregate, anonymized data is used for:
  - Product improvement
  - Industry benchmarking
  - Model training (with explicit consent)

## 6. Data Sharing

### 6.1 We DO NOT Sell Your Data
We never sell personal data to third parties.

### 6.2 Service Providers (Sub-processors)
We use the following sub-processors:

| Provider | Purpose | Location | DPA Status |
|----------|---------|----------|------------|
| AWS (Amazon Web Services) | Cloud infrastructure | India (ap-south-1) | ✓ Signed |
| AWS SES | Transactional email | India | ✓ Signed |
| Twilio | SMS notifications | Global | ✓ Signed |
| Stripe | Payment processing | Global | ✓ Signed |
| Sentry | Error monitoring | EU | ✓ Signed |

### 6.3 Legal Disclosures
We may disclose data when required by:
- Court order or subpoena
- Law enforcement request (with valid legal basis)
- Regulatory authority (RBI, SEBI, Income Tax Department)
- To protect our rights or prevent harm

### 6.4 Cross-Border Transfers
For customers in India: data stays in India (ap-south-1) per RBI data localization.
For customers in EU: data stays in EU (eu-west-1) or transfers to India only with Standard Contractual Clauses (SCCs).

## 7. Data Security

### 7.1 Technical Measures
- **Encryption at rest**: AES-256-GCM with AWS KMS-managed keys
- **Encryption in transit**: TLS 1.3 minimum
- **Field-level encryption**: PII (PAN, Aadhaar, account numbers) encrypted per-field
- **Key management**: AWS KMS with annual rotation, HSM-backed for signing keys
- **Multi-tenant isolation**: Logical separation with RBAC
- **Network security**: VPC, private subnets, WAF, Shield
- **Access control**: SSO/SAML, MFA enforced, least-privilege

### 7.2 Organizational Measures
- ISO 27001 certified ISMS
- SOC 2 Type II audited
- Employee background checks
- Security training (annual)
- Incident response plan (tested quarterly)
- Vendor security assessments

### 7.3 Audit Trail
All access to personal data is logged in an append-only, hash-chained audit trail with non-repudiation. Logs are retained for 10 years.

## 8. Data Retention

| Data Type | Retention Period | Basis |
|-----------|------------------|-------|
| Financial records | 7 years | RBI Master Direction |
| Tax records | 8 years | Income Tax Act |
| Audit logs | 10 years | SOC 2 / ISO 27001 |
| Account data | Account lifetime + 90 days | Customer need |
| Marketing data | Until consent revoked | GDPR consent |
| Anonymized analytics | Indefinite | Not personal data |

After retention period, data is securely deleted or anonymized.

## 9. Your Rights

### 9.1 Under DPDP Act (India)
- **Access**: Request a copy of your personal data
- **Correction**: Correct inaccurate data
- **Erasure**: Request deletion (right to be forgotten)
- **Grievance**: File a grievance with our Data Protection Officer
- **Nomination**: Nominate someone to exercise rights on your behalf

### 9.2 Under GDPR (EU)
- Access (Art. 15)
- Rectification (Art. 16)
- Erasure (Art. 17)
- Restriction (Art. 18)
- Portability (Art. 20)
- Objection (Art. 21)
- Withdraw consent at any time
- Lodge a complaint with supervisory authority

### 9.3 Exercising Rights
Submit requests via:
- In-app: Settings → Privacy → Data Subject Request
- Email: privacy@artha.ai
- API: POST /api/v1/data-subject-requests

We respond within 30 days (DPDP) or 1 month (GDPR).

## 10. Cookies

We use essential cookies for authentication and session management. We do not use advertising cookies.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| finsight_token | Authentication session | 24 hours |
| finsight_refresh_token | Session refresh | 30 days |
| oidc_state | SSO CSRF protection | 10 minutes |

## 11. Children's Privacy

The Service is not intended for children under 18. We do not knowingly collect data from children. If you believe we have collected data from a child, contact us immediately.

## 12. Changes to This Policy

We will notify you of material changes via email and in-app notification 30 days before they take effect.

## 13. Data Protection Officer

**DPO Contact:**
- Name: [DPO Name]
- Email: dpo@artha.ai
- Phone: +91-[PHONE]
- Address: [Registered Office]

## 14. Grievance Redressal (DPDP Act s.14)

If you have a grievance:
1. Contact our DPO at dpo@artha.ai
2. We acknowledge within 24 hours and resolve within 14 days
3. If unsatisfied, you may escalate to the Data Protection Board of India

## 15. Supervisory Authority Complaints

You have the right to lodge a complaint with:
- **India**: Data Protection Board of India
- **EU**: Your local Data Protection Authority
- **UK**: Information Commissioner's Office (ICO)
- **California**: California Attorney General

## 16. Contact

**Artha AI Technologies Pvt. Ltd.**
- Email: privacy@artha.ai
- Address: [Registered Office Address]
- GSTIN: [GSTIN]
- CIN: [CIN]

---

*This Privacy Policy was last updated on January 1, 2025. Version 2.0.*
