# Terms of Service

**Effective Date:** January 1, 2025
**Version:** 2.0

## 1. Agreement to Terms

By accessing or using Artha AI ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization. These Terms constitute a legally binding agreement between you ("Customer", "you", or "your") and Artha AI Technologies Pvt. Ltd. ("Artha AI", "we", "us", or "our").

## 2. Definitions

- **"Customer Data"** means all data uploaded, stored, or processed through the Service.
- **"Personal Data"** has the meaning given in the DPDP Act 2023 and GDPR.
- **"Sensitive Personal Data"** includes PAN, Aadhaar, financial account numbers, and other identifiers defined under applicable law.
- **"Authorized Users"** means individuals authorized by Customer to use the Service.
- **"Tenant"** means an isolated workspace for a Customer organization.

## 3. Eligibility

You must be at least 18 years old and legally capable of entering into contracts. If you are using the Service for a regulated financial activity, you represent that you hold all required licenses and registrations.

## 4. Accounts

### 4.1 Account Creation
You must provide accurate, complete information when creating an account. You are responsible for maintaining the security of your account credentials.

### 4.2 Multi-Tenant Architecture
The Service uses multi-tenant architecture with logical isolation. Your Customer Data is segregated from other customers' data through tenant identifiers and access controls.

### 4.3 Enterprise Accounts
Enterprise customers may provision users via SAML/OIDC SSO and SCIM 2.0. The customer administrator is responsible for managing user access within their tenant.

## 5. Acceptable Use

You agree **not** to:
- Upload data that you do not have rights to process
- Use the Service for any unlawful purpose
- Attempt to access other customers' data
- Reverse engineer, decompile, or disassemble the Service
- Introduce malware, viruses, or harmful code
- Bypass security controls or rate limits
- Use the Service to process data in violation of applicable laws (including but not limited to anti-money laundering, terrorism financing, and sanctions regulations)

## 6. Customer Data

### 6.1 Ownership
Customer retains all rights, title, and interest in Customer Data. Artha AI acts as a data processor on behalf of Customer.

### 6.2 Data Processing
We process Customer Data only as necessary to provide the Service, comply with legal obligations, or as instructed by Customer. Processing activities are documented in our Record of Processing Activities (GDPR Art. 30).

### 6.3 Data Security
We implement bank-grade security measures including:
- AES-256-GCM encryption at rest (field-level for PII)
- TLS 1.3 in transit
- KMS-managed encryption keys with annual rotation
- Multi-tenant isolation with RBAC
- Hash-chained audit trail with non-repudiation
- Data residency in customer-selected AWS region

### 6.4 Data Retention
Customer Data is retained per the customer's configured retention policy. Default retention is 7 years for financial records per RBI requirements. Upon account termination, data is deleted or anonymized within 90 days, except where retention is required by law.

### 6.5 Data Subject Rights
Customer is responsible for handling data subject requests (access, correction, erasure, portability). The Service provides APIs to facilitate these requests. We will assist Customer in responding to such requests.

## 7. Privacy

Our Privacy Policy, incorporated by reference, describes how we handle Personal Data. We are certified under:
- DPDP Act 2023 (India)
- GDPR (European Union)
- ISO/IEC 27001:2022
- SOC 2 Type II

## 8. Service Availability

### 8.1 Uptime Commitment
We commit to 99.95% monthly uptime for production tier. Uptime is measured excluding:
- Scheduled maintenance (announced 7 days in advance)
- Force majeure events
- Customer-caused issues
- AWS region outages

### 8.2 Service Credits
If we fail to meet the uptime commitment, Customer is eligible for service credits:
- 99.0% - 99.94%: 10% of monthly fees
- 95.0% - 98.99%: 25% of monthly fees
- Below 95.0%: 50% of monthly fees

## 9. Intellectual Property

### 9.1 Service
The Service, including software, documentation, and trademarks, is the property of Artha AI and is protected by intellectual property laws.

### 9.2 Customer Data
Customer grants Artha AI a limited, non-exclusive license to use Customer Data solely to provide the Service.

### 9.3 Aggregated and Anonymized Data
We may use aggregated, anonymized data that cannot identify individuals for product improvement, analytics, and benchmarking. Such data is not Customer Data.

## 10. Fees and Payment

### 10.1 Fees
Fees are described in your Order Form. Unless otherwise stated, fees are billed annually in advance.

### 10.2 Taxes
Fees exclude taxes, which are Customer's responsibility, except taxes on Artha AI's net income.

### 10.3 Late Payment
Payments more than 30 days late accrue interest at 1.5% per month or the maximum legal rate, whichever is lower.

## 11. Term and Termination

### 11.1 Term
These Terms begin when you start using the Service and continue until terminated.

### 11.2 Termination for Cause
Either party may terminate for material breach with 30 days' notice to cure.

### 11.3 Termination for Convenience
Enterprise customers may terminate with 90 days' written notice. Refunds are per the Order Form.

### 11.4 Effect of Termination
Upon termination:
- Customer's access to the Service ceases
- Customer Data is deleted or anonymized within 90 days (subject to legal retention)
- Outstanding fees become immediately due
- Confidentiality and IP provisions survive

## 12. Confidentiality

Each party agrees to protect the other's confidential information with at least the same care it uses for its own. Confidentiality obligations survive for 5 years after termination.

## 13. Warranties and Disclaimers

### 13.1 Our Warranties
We warrant that:
- The Service will perform substantially as described
- We will comply with applicable laws
- We will maintain SOC 2 Type II and ISO 27001 certifications

### 13.2 Disclaimers
EXCEPT AS EXPRESSLY PROVIDED, THE SERVICE IS PROVIDED "AS IS". WE DISCLAIM ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

### 13.3 Tax Advice Disclaimer
The Service provides tax estimations and analysis based on data you provide. These are not tax advice. Consult a qualified tax professional for your specific situation.

## 14. Limitation of Liability

### 14.1 Liability Cap
EACH PARTY'S TOTAL LIABILITY IS LIMITED TO THE FEES PAID IN THE 12 MONTHS PRECEDING THE CLAIM.

### 14.2 Excluded Damages
NEITHER PARTY IS LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION.

### 14.3 Exceptions
These limits do not apply to:
- Customer's payment obligations
- Breach of confidentiality
- Indemnification obligations
- Liability that cannot be limited under applicable law

## 15. Indemnification

### 15.1 By Customer
Customer will indemnify Artha AI from claims arising from Customer Data or Customer's breach of these Terms.

### 15.2 By Artha AI
We will indemnify Customer from claims that the Service infringes third-party IP rights.

## 16. Compliance with Laws

### 16.1 Regulatory Compliance
We comply with:
- RBI Master Directions on Outsourcing of IT Services
- DPDP Act 2023
- GDPR
- ISO/IEC 27001:2022
- SOC 2 Type II

### 16.2 Audit Rights
Customer may audit our compliance once annually with 30 days' notice, subject to confidentiality. We will provide SOC 2 Type II reports in lieu of on-site audits.

## 17. Data Processing Addendum

Our DPA (separate document) governs the processing of Personal Data and is incorporated by reference for customers subject to GDPR or DPDP Act.

## 18. Modifications

We may modify these Terms with 30 days' notice. Continued use after the effective date constitutes acceptance.

## 19. Governing Law and Dispute Resolution

### 19.1 Governing Law
These Terms are governed by the laws of India. Courts in Mumbai have exclusive jurisdiction.

### 19.2 Arbitration
Disputes are resolved through binding arbitration in Mumbai under the Arbitration and Conciliation Act, 1996.

## 20. Contact

**Artha AI Technologies Pvt. Ltd.**
Email: legal@artha.ai
Address: [Registered Office Address]
GSTIN: [GSTIN]
CIN: [CIN]

---

*These Terms were last updated on January 1, 2025. Version 2.0.*
