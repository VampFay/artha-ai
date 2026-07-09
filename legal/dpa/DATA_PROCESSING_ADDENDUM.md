# Data Processing Addendum (DPA)

**Effective Date:** January 1, 2025
**Version:** 2.0

This Data Processing Addendum ("DPA") is incorporated into the Terms of Service between Artha AI Technologies Pvt. Ltd. ("Processor") and the Customer ("Controller"). This DPA reflects the parties' agreement with regard to the Processing of Personal Data.

## 1. Definitions

- **"Personal Data"** — any information relating to an identified or identifiable natural person, as defined in GDPR Art. 4(1) and DPDP Act s.2(t).
- **"Processing"** — any operation performed on Personal Data (collection, recording, organization, storage, use, disclosure, etc.).
- **"Data Subject"** — the individual to whom Personal Data relates.
- **"Controller"** — Customer, who determines purposes and means of Processing.
- **"Processor"** — Artha AI, who Processes Personal Data on behalf of Controller.
- **"Sub-processor"** — third party engaged by Processor to assist in Processing.
- **"Supervisory Authority"** — regulatory body (e.g., Data Protection Board of India, EU DPA).
- **"Standard Contractual Clauses"** — EU Commission's standard contractual terms for international data transfers.
- **"Personal Data Breach"** — security breach leading to accidental or unlawful destruction, loss, alteration, unauthorized disclosure of Personal Data.

## 2. Roles and Scope

### 2.1 Roles
Processor acts as a **Data Processor** on behalf of Controller. Controller is the **Data Controller** and determines the purposes and means of Processing.

### 2.2 Scope
This DPA applies to all Processing of Personal Data by Processor on behalf of Controller under the Terms of Service.

### 2.3 Categories of Data Subjects
- Controller's customers (if Controller is a financial institution)
- Controller's employees and authorized users
- Individuals whose data is contained in documents uploaded by Controller

### 2.4 Categories of Personal Data
- Identity data (name, email, phone)
- Government IDs (PAN, Aadhaar)
- Financial data (account numbers, transactions, balances)
- Tax-related data (Form 16, AIS, etc.)
- Usage data (IP, device, audit trail)

### 2.5 Sensitive/Special Categories
- Financial data revealing economic situation
- Biometric data (if used for authentication)

## 3. Processing Instructions

### 3.1 Controller's Instructions
Processor will Process Personal Data only on documented instructions from Controller, including with regard to transfers of Personal Data to third countries.

### 3.2 Scope of Instructions
The Terms of Service (including this DPA) constitute Controller's complete instructions to Processor. Additional instructions must be agreed in writing.

### 3.3 Legal Compliance
Processor will not Process Personal Data in violation of applicable law. If Processor believes an instruction violates GDPR, DPDP Act, or other law, Processor will notify Controller.

### 3.4 Processing Outside Scope
Processor will promptly notify Controller if Processor can no longer comply with this DPA. In such case, Processor may suspend Processing until Controller resolves the issue or terminates the service.

## 4. Data Subject Rights

### 4.1 Assistance
Processor will assist Controller in responding to Data Subject requests regarding:
- Access to Personal Data
- Rectification of inaccurate data
- Erasure (right to be forgotten)
- Restriction of Processing
- Data portability
- Objection to Processing

### 4.2 Forwarding Requests
If Processor receives a Data Subject request directly, Processor will forward it to Controller without responding, unless legally required.

## 5. Confidentiality

### 5.1 Personnel
Processor ensures that personnel authorized to Process Personal Data:
- Are subject to confidentiality obligations
- Have undergone background verification (where required by law)
- Receive data protection training
- Process Personal Data only on documented instructions

### 5.2 Access Control
Processor implements role-based access control (RBAC). Personnel access is:
- Limited to Personal Data necessary for their role
- Logged in an immutable audit trail
- Reviewed quarterly
- Revoked promptly upon role change or termination

## 6. Security Measures

### 6.1 Technical Measures
Processor maintains bank-grade security:
- **Encryption at rest**: AES-256-GCM, KMS-managed keys, annual rotation
- **Encryption in transit**: TLS 1.3 minimum
- **Field-level encryption**: PII encrypted per-field with envelope encryption
- **Key management**: AWS KMS (HSM-backed for signing keys)
- **Network security**: VPC, private subnets, WAF, DDoS protection
- **Access control**: SSO/SAML, MFA enforced, RBAC
- **Audit trail**: Hash-chained, append-only, 10-year retention
- **Backup**: Encrypted, cross-region replication, 30-day retention

### 6.2 Organizational Measures
- ISO 27001 certified ISMS
- SOC 2 Type II audited annually
- Security awareness training (annual)
- Incident response plan (tested quarterly)
- Vendor security assessments
- Background checks on personnel

### 6.3 Certifications
Processor maintains:
- ISO/IEC 27001:2022 certification
- SOC 2 Type II audit
- ISO/IEC 27017:2015 (cloud security)
- ISO/IEC 27018:2019 (PII in public clouds)

## 7. Sub-processors

### 7.1 Authorization
Controller grants Processor general authorization to engage sub-processors. Processor maintains a current list at https://artha.ai/sub-processors.

### 7.2 Notice of Changes
Processor will notify Controller of intended changes to sub-processors at least 30 days in advance, giving Controller the opportunity to object.

### 7.3 Sub-processor Agreements
Processor enters into written agreements with sub-processors imposing the same data protection obligations as this DPA.

### 7.4 Liability
Processor remains fully liable to Controller for sub-processors' performance of Processing activities.

## 8. Personal Data Breach

### 8.1 Notification
Processor will notify Controller of a Personal Data Breach without undue delay and in any case within **72 hours** of becoming aware of the breach.

### 8.2 Notification Contents
The notification will include:
- Nature of the breach
- Categories and approximate number of Data Subjects affected
- Categories and approximate number of Personal Data records affected
- Likely consequences
- Measures taken or proposed to address the breach and mitigate adverse effects
- Contact point for more information

### 8.3 Cooperation
Processor will cooperate with Controller in investigating and mitigating the breach, including:
- Providing detailed forensic information
- Assisting with notifications to Data Subjects and Supervisory Authorities
- Implementing corrective actions

### 8.4 Controller's Notification Obligations
Controller is responsible for notifying:
- Supervisory Authorities (within 72 hours per GDPR Art. 33)
- Data Subjects (without undue delay per GDPR Art. 34)
- DPDP Act notifications (within 72 hours)

## 9. Data Protection Impact Assessment (DPIA)

### 9.1 Assistance
Processor will assist Controller in conducting DPIAs where:
- Processing is likely to result in high risk to Data Subjects
- Controller is required to conduct a DPIA under GDPR Art. 35

### 9.2 Information Provided
Processor will provide:
- Description of Processing operations
- Security measures in place
- Documentation of Processor's own DPIAs

## 10. International Data Transfers

### 10.1 Data Residency
Processor processes Personal Data in the AWS region selected by Controller:
- **India (ap-south-1)**: Default for Indian customers, complies with RBI data localization
- **EU (eu-west-1)**: For EU customers
- **US (us-east-1)**: For US customers

### 10.2 Standard Contractual Clauses
For transfers outside the EEA, the EU Commission's Standard Contractual Clauses (Module 2: Controller to Processor) are incorporated by reference.

### 10.3 Transfer Impact Assessments
Processor will provide Transfer Impact Assessments upon request.

### 10.4 DPDP Act Cross-Border Restrictions
Processor will not transfer Personal Data outside India without:
- Controller's explicit consent
- Compliance with DPDP Act s.17 (transfer to countries whitelisted by Indian government)

## 11. Data Deletion and Return

### 11.1 Upon Termination
Upon termination of the Terms of Service, Processor will:
- Return Personal Data to Controller in a structured, machine-readable format
- Delete all copies of Personal Data within 90 days
- Provide certification of deletion upon request

### 11.2 Legal Retention
Processor may retain Personal Data where required by law (e.g., RBI 7-year retention). Such retained data will be:
- Isolated from active systems
- Accessible only for legal compliance purposes
- Deleted when the legal retention period expires

### 11.3 Backup Retention
Backup copies of Personal Data are retained per the backup schedule (30 days for daily backups). After this period, backups are securely destroyed.

## 12. Audit Rights

### 12.1 SOC 2 Report
Processor will provide Controller with a copy of its SOC 2 Type II report annually, in lieu of on-site audits.

### 12.2 On-Site Audit
If Controller's DPA or applicable law requires an on-site audit, Controller may conduct one audit per year with:
- 30 days' written notice
- During business hours
- Subject to confidentiality
- At Controller's expense

### 12.3 Auditor Qualifications
Auditor must be:
- Independent (not a competitor)
- Bound by confidentiality
- Qualified to perform data protection audits

## 13. Records of Processing Activities

Processor maintains Records of Processing Activities per GDPR Art. 30(2), including:
- Name and contact details of Processor and Processor's DPO
- Categories of Processing for each Controller
- Description of Personal Data categories
- Transfers to third countries
- Description of technical and organizational security measures

## 14. Data Protection Officer

Processor's DPO contact:
- Email: dpo@artha.ai
- Phone: +91-[PHONE]

## 15. Liability

Each party's liability under this DPA is subject to the liability limitations in the Terms of Service. However, liability for breaches of data protection obligations shall not be subject to the general liability cap.

## 16. Term

This DPA remains in effect for the duration of the Terms of Service and thereafter until all Personal Data is deleted or returned.

## 17. Governing Law

This DPA is governed by the laws of India, exclusive of conflict-of-law principles. Courts in Mumbai have exclusive jurisdiction.

## 18. Changes

Processor may update this DPA to reflect changes in law or regulatory guidance with 30 days' notice.

## 19. Signatures

**For Artha AI Technologies Pvt. Ltd. (Processor):**
Name: ______________________
Title: ______________________
Date: ______________________

**For Customer (Controller):**
Name: ______________________
Title: ______________________
Date: ______________________

---

*Annex A: Standard Contractual Clauses (incorporated by reference)*
*Annex B: List of Sub-processors (available at https://artha.ai/sub-processors)*
*Annex C: Technical and Organizational Security Measures (see Section 6)*

*DPA Version 2.0 — Effective January 1, 2025*
