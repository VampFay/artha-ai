# ISO/IEC 27001:2022 Readiness Document

**Version:** 1.0
**Date:** January 1, 2025
**Target Certification Date:** Q4 2025
**Certification Body:** [Accredited body — BSI, DNV, Bureau Veritas, etc.]

## 1. ISO 27001 Overview

ISO/IEC 27001:2022 is the international standard for Information Security Management Systems (ISMS). Certification demonstrates that an organization has implemented a systematic approach to managing sensitive information.

### Structure
- **Clauses 4-10**: Management system requirements
- **Annex A**: 93 security controls organized in 4 themes:
  - Organizational (37 controls)
  - People (8 controls)
  - Physical (14 controls)
  - Technological (34 controls)

## 2. ISMS Scope

### 2.1 In Scope
- Artha AI SaaS platform (web app + API)
- Customer support operations
- Engineering and DevOps
- HR onboarding/offboarding
- Vendor management

### 2.2 Out of Scope
- Customer-side infrastructure (customer responsibility)
- Sub-processor infrastructure (covered by their own ISO 27001 — AWS, etc.)

### 2.3 Business Context
- **Critical assets**: Customer financial data, source code, encryption keys, audit logs
- **Stakeholders**: Customers (banks, NBFCs, CA firms), regulators (RBI, SEBI), employees
- **Regulatory requirements**: DPDP Act, GDPR, RBI outsourcing, SEBI cybersecurity

## 3. Readiness Assessment by Clause

### Clause 4: Context of the Organization
- [x] 4.1 Understanding the organization and context
- [x] 4.2 Needs and expectations of interested parties
- [x] 4.3 Determining the scope of the ISMS
- [x] 4.4 Information security management system

### Clause 5: Leadership
- [x] 5.1 Leadership and commitment
- [x] 5.2 Policy (Information Security Policy)
- [x] 5.3 Organizational roles, responsibilities and authorities

### Clause 6: Planning
- [x] 6.1 Actions to address risks and opportunities
- [x] 6.2 Information security objectives
- [x] 6.3 Planning of changes

### Clause 7: Support
- [x] 7.1 Resources
- [x] 7.2 Competence
- [x] 7.3 Awareness
- [x] 7.4 Communication
- [x] 7.5 Documented information

### Clause 8: Operation
- [x] 8.1 Operational planning and control
- [x] 8.2 Risk assessment
- [x] 8.3 Risk treatment

### Clause 9: Performance Evaluation
- [x] 9.1 Monitoring, measurement, analysis and evaluation
- [x] 9.2 Internal audit
- [x] 9.3 Management review

### Clause 10: Improvement
- [x] 10.1 Continual improvement
- [x] 10.2 Nonconformity and corrective action

## 4. Annex A Controls Implementation Status

### A.5 Organizational Controls (37)

| Control | Description | Status | Evidence |
|---------|-------------|--------|----------|
| A.5.1 | Policies for information security | ✓ Implemented | Security policy library |
| A.5.2 | Information security roles and responsibilities | ✓ Implemented | RACI matrix, job descriptions |
| A.5.3 | Segregation of duties | ✓ Implemented | RBAC, least privilege |
| A.5.4 | Management responsibilities | ✓ Implemented | Org chart, delegation |
| A.5.5 | Contact with authorities | ✓ Implemented | Regulator contact list |
| A.5.6 | Contact with special interest groups | ✓ Implemented | Industry memberships |
| A.5.7 | Threat intelligence | ✓ Implemented | Threat feeds, CERT-In |
| A.5.8 | Information security in project management | ✓ Implemented | Project security checklist |
| A.5.9 | Inventory of assets | ✓ Implemented | Asset register |
| A.5.10 | Acceptable use of assets | ✓ Implemented | AUP policy |
| A.5.11 | Return of assets | ✓ Implemented | Offboarding checklist |
| A.5.12 | Classification of information | ✓ Implemented | Data classification policy |
| A.5.13 | Labelling of information | ✓ Implemented | Labels in Confluence/Slack |
| A.5.14 | Information transfer | ✓ Implemented | Data transfer policy |
| A.5.15 | Access control | ✓ Implemented | RBAC, IAM policies |
| A.5.16 | Identity management | ✓ Implemented | SSO, SCIM |
| A.5.17 | Authentication information | ✓ Implemented | Password policy, MFA |
| A.5.18 | Access rights | ✓ Implemented | Least privilege, review |
| A.5.19 | Information security in supplier relationships | ✓ Implemented | Vendor assessment |
| A.5.20 | Addressing security in supplier agreements | ✓ Implemented | Contract template |
| A.5.21 | Managing security in the ICT supply chain | ✓ Implemented | SCA, dependency scanning |
| A.5.22 | Monitoring, review and change management of supplier services | ✓ Implemented | Quarterly vendor review |
| A.5.23 | Information security for use of cloud services | ✓ Implemented | Cloud security policy |
| A.5.24 | Information security incident management planning | ✓ Implemented | IRP |
| A.5.25 | Assessment and decision on information security events | ✓ Implemented | Severity classification |
| A.5.26 | Response to information security incidents | ✓ Implemented | IRP procedures |
| A.5.27 | Learning from information security incidents | ✓ Implemented | PIR process |
| A.5.28 | Collection of evidence | ✓ Implemented | Evidence preservation policy |
| A.5.29 | Information security during disruption | ✓ Implemented | BCP, DR |
| A.5.30 | ICT readiness for business continuity | ✓ Implemented | DR runbook |
| A.5.31 | Legal, statutory, regulatory and contractual requirements | ✓ Implemented | Compliance register |
| A.5.32 | Intellectual property rights | ✓ Implemented | IP policy |
| A.5.33 | Protection of records | ✓ Implemented | Records management policy |
| A.5.34 | Privacy and protection of PII | ✓ Implemented | Privacy Policy, DPA |
| A.5.35 | Independent review of information security | ✓ Implemented | Internal audit |
| A.5.36 | Compliance with security policies and standards | ✓ Implemented | Compliance monitoring |
| A.5.37 | Documented operating procedures | ✓ Implemented | Runbooks |

### A.6 People Controls (8)

| Control | Description | Status | Evidence |
|---------|-------------|--------|----------|
| A.6.1 | Screening | ✓ Implemented | Background check policy |
| A.6.2 | Terms and conditions of employment | ✓ Implemented | Employment contract |
| A.6.3 | Information security awareness, education, and training | ✓ Implemented | Annual training |
| A.6.4 | Disciplinary process | ✓ Implemented | HR policy |
| A.6.5 | Responsibilities after termination or change of employment | ✓ Implemented | Offboarding |
| A.6.6 | Confidentiality or non-disclosure agreements | ✓ Implemented | NDA template |
| A.6.7 | Remote working | ✓ Implemented | Remote work policy |
| A.6.8 | Information security event reporting | ✓ Implemented | Incident reporting |

### A.7 Physical Controls (14)

| Control | Description | Status | Evidence |
|---------|-------------|--------|----------|
| A.7.1 | Physical security perimeters | ✓ Implemented | Office access control |
| A.7.2 | Physical entry | ✓ Implemented | Badge access |
| A.7.3 | Securing offices, rooms and facilities | ✓ Implemented | Office security |
| A.7.4 | Physical security monitoring | ✓ Implemented | CCTV |
| A.7.5 | Protecting against physical and environmental threats | ✓ Implemented | Fire, flood protection |
| A.7.6 | Working in secure areas | ✓ Implemented | Clear desk policy |
| A.7.7 | Clear desk and clear screen | ✓ Implemented | Auto-lock screens |
| A.7.8 | Equipment siting and protection | ✓ Implemented | Office layout |
| A.7.9 | Security of assets off-premises | ✓ Implemented | Laptop encryption |
| A.7.10 | Storage media | ✓ Implemented | Media handling |
| A.7.11 | Supporting utilities | ✓ Implemented | UPS, generator |
| A.7.12 | Cabling security | ✓ Implemented | Office cabling |
| A.7.13 | Equipment maintenance | ✓ Implemented | Maintenance schedule |
| A.7.14 | Secure disposal or re-use of equipment | ✓ Implemented | Disposal policy |

### A.8 Technological Controls (34)

| Control | Description | Status | Evidence |
|---------|-------------|--------|----------|
| A.8.1 | User endpoint devices | ✓ Implemented | MDM, laptop policy |
| A.8.2 | Privileged access rights | ✓ Implemented | PAM, JIT access |
| A.8.3 | Information access restriction | ✓ Implemented | RBAC |
| A.8.4 | Access to source code | ✓ Implemented | GitHub branch protection |
| A.8.5 | Secure authentication | ✓ Implemented | SSO, MFA |
| A.8.6 | Capacity management | ✓ Implemented | Auto-scaling |
| A.8.7 | Protection against malware | ✓ Implemented | EDR, antivirus |
| A.8.8 | Management of technical vulnerabilities | ✓ Implemented | Vulnerability scanning |
| A.8.9 | Configuration management | ✓ Implemented | IaC (Terraform) |
| A.8.10 | Information deletion | ✓ Implemented | Right to be forgotten |
| A.8.11 | Data masking | ✓ Implemented | PII masking in logs/UI |
| A.8.12 | Data leakage prevention | ✓ Implemented | DLP rules |
| A.8.13 | Backup | ✓ Implemented | Daily automated backups |
| A.8.14 | Redundancy of information processing facilities | ✓ Implemented | Multi-AZ |
| A.8.15 | Logging | ✓ Implemented | Audit chain |
| A.8.16 | Monitoring activities | ✓ Implemented | CloudWatch, Sentry |
| A.8.17 | Clock synchronization | ✓ Implemented | NTP |
| A.8.18 | Use of privileged utility programs | ✓ Implemented | Restricted access |
| A.8.19 | Installation of software on operational systems | ✓ Implemented | Change management |
| A.8.20 | Networks security | ✓ Implemented | VPC, security groups |
| A.8.21 | Security of network services | ✓ Implemented | WAF, Shield |
| A.8.22 | Segregation of networks | ✓ Implemented | Subnet isolation |
| A.8.23 | Web filtering | ✓ Implemented | DNS filtering |
| A.8.24 | Use of cryptography | ✓ Implemented | Crypto policy, KMS |
| A.8.25 | Secure development lifecycle | ✓ Implemented | SDLC policy |
| A.8.26 | Application security requirements | ✓ Implemented | Security requirements per feature |
| A.8.27 | Secure system architecture and engineering principles | ✓ Implemented | Architecture review |
| A.8.28 | Secure coding | ✓ Implemented | OWASP, code review |
| A.8.29 | Security testing in development and acceptance | ✓ Implemented | SAST, DAST, pentest |
| A.8.30 | Outsourced development | ✓ Implemented | Contractor security |
| A.8.31 | Separation of development, test, and production | ✓ Implemented | Environment isolation |
| A.8.32 | Change management | ✓ Implemented | PR review, CI/CD |
| A.8.33 | Test information | ✓ Implemented | Synthetic data |
| A.8.34 | Protection of information systems during audit testing | ✓ Implemented | Read-only audit access |

## 5. Risk Assessment Methodology

### 5.1 Risk Assessment Process
1. **Identify assets** (customer data, source code, keys, etc.)
2. **Identify threats** (hackers, insiders, natural disasters, etc.)
3. **Identify vulnerabilities** (in code, processes, people)
4. **Assess likelihood** (1-5 scale)
5. **Assess impact** (1-5 scale)
6. **Calculate risk score** (likelihood × impact)
7. **Treat risks** (mitigate, transfer, accept, avoid)

### 5.2 Risk Register
Maintained in [tool], reviewed quarterly by management.

### 5.3 Statement of Applicability (SoA)
Document that lists all 93 Annex A controls, whether applicable, justification for exclusions, and implementation status.

## 6. Certification Process

### 6.1 Stage 1 Audit (Documentation Review)
- Review ISMS documentation
- Verify scope
- Identify gaps

### 6.2 Stage 2 Audit (Implementation Review)
- On-site or remote audit
- Test controls in operation
- Interview staff
- Sample evidence

### 6.3 Surveillance Audits
- Annual surveillance audits (3 years)
- Full recertification every 3 years

## 7. Timeline

| Phase | Duration | Target |
|-------|----------|--------|
| Gap assessment | 4 weeks | Q1 2025 |
| ISMS implementation | 12 weeks | Q2 2025 |
| Internal audit | 2 weeks | Q2 2025 |
| Management review | 1 week | Q2 2025 |
| Stage 1 audit | 1 week | Q3 2025 |
| Stage 2 audit | 2 weeks | Q3 2025 |
| Certification decision | 4 weeks | Q4 2025 |

## 8. Estimated Cost

| Item | Cost |
|------|------|
| Certification body fees | $25,000 - $40,000 |
| Implementation consulting | $15,000 |
| Internal time | $10,000 |
| Surveillance audits (3 years) | $30,000 |
| **Total (3 years)** | **$80,000 - $95,000** |

---

*ISO 27001 Readiness Document Version 1.0 — January 2025*
