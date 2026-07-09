# Vendor Security Assessment Questionnaire

**Vendor:** Artha AI Technologies Pvt. Ltd.
**Assessment Date:** ____________
**Assessed By:** ____________
**Questionnaire Version:** 2.0

---

## Section 1: Company Information

| Question | Response |
|----------|----------|
| Legal entity name | Artha AI Technologies Pvt. Ltd. |
| Year founded | 2024 |
| Headquarters | Mumbai, India |
| Total employees | ___ |
| Total customers | ___ |
| Last funding round | ___ |
| Public or private | Private |
| CIN | [CIN] |
| GSTIN | [GSTIN] |
| DPO contact | dpo@artha.ai |
| Security contact | security@artha.ai |

---

## Section 2: Compliance & Certifications

| Question | Response | Evidence |
|----------|----------|----------|
| SOC 2 Type II certified? | In progress (expected Q3 2025) | Audit firm engagement letter available on request |
| ISO 27001 certified? | In progress (expected Q4 2025) | Stage 1 audit scheduled |
| ISO 27017 certified? | In progress | Included in ISO 27001 scope |
| ISO 27018 certified? | In progress | Included in ISO 27001 scope |
| PCI DSS certified? | N/A — does not process card data | N/A |
| HIPAA compliant? | N/A — does not process health data | N/A |
| GDPR compliant? | Yes | DPA available, Records of Processing maintained |
| DPDP Act 2023 compliant? | Yes | DPO appointed, consent management in place |
| RBI compliant? | Yes (for outsourcing to regulated entities) | Compliant with Master Direction on Outsourcing |
| SEBI compliant? | Yes (for capital market entities) | Compliant with SEBI cybersecurity circular |
| Last penetration test date | Q4 2024 | Report by [CERT-In empaneled auditor] available under NDA |
| Next pentest scheduled | Q2 2025 | |
| Cyber insurance? | Yes — $5M coverage | Certificate available on request |

---

## Section 3: Data Security

### 3.1 Encryption
| Question | Response |
|----------|----------|
| Data encrypted at rest? | Yes — AES-256-GCM |
| PII encrypted at field level? | Yes — envelope encryption via AWS KMS |
| Data encrypted in transit? | Yes — TLS 1.3 minimum |
| Key management system? | AWS KMS (HSM-backed for signing keys) |
| Key rotation policy? | Annual automatic rotation |
| Who has access to keys? | KMS service role only — no human access to plaintext keys |

### 3.2 Access Control
| Question | Response |
|----------|----------|
| Authentication method? | Email/password (with MFA optional), SAML/OIDC SSO for enterprise |
| MFA supported? | Yes (enforced for enterprise tier) |
| RBAC? | Yes — system roles + custom roles per tenant |
| Principle of least privilege? | Yes — RBAC enforced at API level |
| Access reviews? | Quarterly |
| Privileged access management? | Yes — JIT access via AWS SSO + audit logging |
| Session management? | JWT access (24h) + refresh (30d) with rotation |
| Password policy? | Min 12 chars, complexity, breach check via HIBP |
| Account lockout? | Yes — 5 failed attempts triggers 15-min lockout |

### 3.3 Network Security
| Question | Response |
|----------|----------|
| Network isolation? | Yes — VPC with private subnets for app and data tiers |
| Database public access? | No — private subnets only |
| WAF? | Yes — AWS WAF with OWASP rules + rate limiting |
| DDoS protection? | Yes — CloudFront + AWS Shield |
| IDS/IPS? | Yes — AWS GuardDuty |
| Network monitoring? | Yes — VPC Flow Logs + CloudTrail |
| mTLS between services? | Yes — via service mesh (optional deployment) |

### 3.4 Application Security
| Question | Response |
|----------|----------|
| Secure SDLC? | Yes — OWASP-aligned, includes SAST, DAST, SCA |
| Code review? | Yes — mandatory peer review + automated security checks |
| Dependency scanning? | Yes — Dependabot + Snyk |
| Container scanning? | Yes — Trivy in CI/CD |
| Secrets in code? | No — all secrets in AWS Secrets Manager |
| API authentication? | JWT + API keys (per-tenant, scoped) |
| Input validation? | Yes — Zod schemas on all API endpoints |
| Output encoding? | Yes — React JSX prevents XSS |
| CSRF protection? | Yes — Origin header validation + SameSite cookies |
| SQL injection protection? | Yes — Prisma ORM with parameterized queries |
| Rate limiting? | Yes — per-IP + per-API-key, configurable per tenant |

---

## Section 4: Data Privacy

### 4.1 Data Processing
| Question | Response |
|----------|----------|
| Acts as controller or processor? | Processor (for enterprise), Controller (for individuals) |
| Data Processing Agreement? | Yes — DPA available |
| Records of Processing Activities? | Yes — maintained per GDPR Art. 30 |
| Lawful basis for processing? | Contract, consent, legal obligation (per purpose) |
| Consent management? | Yes — granular per-purpose, revocable |
| Data subject rights? | Yes — access, rectification, erasure, portability, restriction, objection |
| Right to be forgotten? | Yes — verifiable deletion pipeline |

### 4.2 Data Retention
| Question | Response |
|----------|----------|
| Default retention? | 7 years (RBI requirement for financial records) |
| Configurable per tenant? | Yes — per resource type, per jurisdiction |
| Disposal method? | Secure deletion (overwrite) + certificate |
| Backup retention? | 30 days (daily), 90 days (weekly), 7 years (monthly archive) |

### 4.3 Cross-Border Transfers
| Question | Response |
|----------|----------|
| Data residency options? | India (ap-south-1), EU (eu-west-1), US (us-east-1) |
| Cross-border transfer? | Only with customer consent + SCCs |
| Data localization (India)? | Yes — RBI compliant |
| Transfer Impact Assessment? | Yes — provided on request |

---

## Section 5: Sub-processors

| Sub-processor | Purpose | Location | DPA |
|---------------|---------|----------|-----|
| AWS | Cloud infrastructure | India (ap-south-1) | Yes |
| AWS SES | Email | India | Yes |
| Twilio | SMS | Global | Yes |
| Stripe | Payments | Global | Yes |
| Sentry | Error monitoring | EU | Yes |
| Cloudflare | DNS/CDN | Global | Yes |

Full list at https://artha.ai/sub-processors. Notify customers 30 days before adding new sub-processors.

---

## Section 6: Incident Response

| Question | Response |
|----------|----------|
| IRP documented? | Yes — reviewed quarterly |
| On-call coverage? | 24/7 for P0/P1 |
| Incident detection? | Automated via CloudWatch, GuardDuty, Sentry |
| Breach notification? | Within 72 hours (GDPR/DPDP) |
| Customer notification? | Per SLA Section 10 |
| Forensic capabilities? | In-house + external firm on retainer |
| Tabletop exercises? | Quarterly |
| Last incident? | [If applicable, summarize] |

---

## Section 7: Business Continuity & DR

| Question | Response |
|----------|----------|
| BCP documented? | Yes |
| DR plan? | Yes — DR_RUNBOOK.md |
| RPO | < 15 minutes |
| RTO | < 4 hours |
| DR strategy? | Active-passive, cross-region |
| DR test frequency? | Quarterly |
| Last DR test? | [Date] |
| Backup frequency? | Daily automated + manual weekly |
| Backup encryption? | Yes — KMS-managed |
| Backup verification? | Monthly restore tests |

---

## Section 8: Physical Security

| Question | Response |
|----------|----------|
| Own data centers? | No — uses AWS |
| AWS compliance? | ISO 27001, SOC 1/2/3, PCI DSS, FedRAMP |
| Physical access controls? | Per AWS (badge, biometric, 24/7 guards) |
| Office security? | Badge access, CCTV, visitor logging |

---

## Section 9: Personnel Security

| Question | Response |
|----------|----------|
| Background checks? | Yes — for all employees (educational, criminal, employment) |
| NDA? | Yes — all employees + contractors |
| Security training? | Annual + onboarding |
| Phishing simulations? | Quarterly |
| Access revocation on termination? | Same day |
| Code of conduct? | Yes |

---

## Section 10: Audit & Reporting

| Question | Response |
|----------|----------|
| Audit trail? | Yes — hash-chained, append-only, 10-year retention |
| Audit log integrity? | Cryptographic non-repudiation via KMS signing |
| Log retention? | 10 years |
| Customer audit rights? | Yes — annual, with 30-day notice |
| Third-party audit reports? | SOC 2 Type II (when complete), ISO 27001 (when complete) |
| Continuous monitoring? | Yes — AWS Config, Security Hub, GuardDuty |

---

## Section 11: Contractual Terms

| Question | Response |
|----------|----------|
| Indemnification for data breach? | Yes — per Terms of Service |
| Liability cap? | Per contract negotiation |
| Data breach liability? | Per DPA + Terms |
| Right to audit? | Yes — annual with 30-day notice |
| Right to terminate for security failure? | Yes — 30-day cure period |
| Data return/deletion on termination? | Yes — within 90 days + certificate |
| Sub-processor restrictions? | Yes — 30-day notice, customer may object |

---

## Section 12: Additional Documentation

Available under NDA:
- [ ] SOC 2 Type II report (when complete)
- [ ] ISO 27001 certificate (when complete)
- [ ] Penetration test report (latest)
- [ ] DPA template
- [ ] SLA
- [ ] Incident Response Plan
- [ ] DR Runbook
- [ ] Architecture diagram
- [ ] Data flow diagram
- [ ] Sub-processor list
- [ ] Insurance certificate
- [ ] Last 12 months of uptime metrics

---

## Sign-off

**Vendor Representative:**
Name: ______________________
Title: ______________________
Signature: ______________________
Date: ______________________

**Customer Assessor:**
Name: ______________________
Title: ______________________
Signature: ______________________
Date: ______________________
