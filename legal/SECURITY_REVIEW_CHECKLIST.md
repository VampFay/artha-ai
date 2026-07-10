# Security Review Checklist

**Version:** 1.0
**Last Updated:** January 1, 2025

This checklist documents the bank-grade security controls implemented in Artha AI.

## 1. Authentication & Authorization

- [x] Password hashing with bcrypt (cost factor 12)
- [x] JWT access tokens (24h expiry)
- [x] Refresh token rotation (revoke-on-use, prevents replay)
- [x] Token revocation list (RevokedToken table)
- [x] Rate limiting on auth endpoints (10/min)
- [x] Account lockout after 5 failed attempts (15-min)
- [x] SAML 2.0 SSO (SP-initiated)
- [x] OIDC SSO (Authorization Code flow with PKCE)
- [x] SCIM 2.0 user provisioning (GET/POST/PUT/PATCH/DELETE)
- [x] Multi-tenant RBAC (5 system roles + custom roles)
- [x] Per-tenant API keys with scoped permissions
- [x] IRSA (IAM Roles for Service Accounts) — no static AWS credentials
- [x] MFA enforcement per tenant (configurable)

## 2. Encryption

- [x] TLS 1.3 in transit (enforced at CloudFront + ALB)
- [x] AES-256-GCM at rest (RDS, S3, EBS)
- [x] Field-level encryption for PII (PAN, Aadhaar, account numbers)
- [x] Envelope encryption via KMS (DEK per record, wrapped by master key)
- [x] KMS key rotation (annual automatic)
- [x] HSM-backed signing keys (CloudHSM in prod, local in dev)
- [x] PDF digital signatures (RSASSA-PKCS1-v1_5-SHA-256)
- [x] Webhook HMAC-SHA256 signing
- [x] Audit chain hash (SHA-256) with KMS-signed anchors
- [x] Secrets in AWS Secrets Manager (no .env in prod)
- [x] OIDC client secrets encrypted at rest in DB
- [x] SCIM tokens encrypted at rest in DB

## 3. Access Control

- [x] Principle of least privilege (RBAC)
- [x] Quarterly access reviews
- [x] JIT privileged access (AWS SSO + IAM Identity Center)
- [x] Network isolation (private subnets for app + data)
- [x] Security groups (least-privilege ingress)
- [x] No public DB access (RDS in private subnets)
- [x] VPC Flow Logs (1-year retention)
- [x] CloudTrail audit (all AWS API calls logged)
- [x] Per-tenant data isolation (tenantId on all queries)
- [x] API key IP allowlists (per-tenant)

## 4. Network Security

- [x] AWS WAF with OWASP rules (Common, SQLi, Bad Inputs)
- [x] Rate limiting at WAF (2000 req/5min per IP)
- [x] Geo-blocking (whitelist: IN, US, SG, AE, GB, DE, FR, AU, CA)
- [x] CloudFront DDoS protection (AWS Shield Standard)
- [x] AWS Shield Advanced (for production tier)
- [x] HTTPS-only (redirect HTTP → HTTPS)
- [x] HSTS (max-age=63072000, includeSubDomains, preload)
- [x] Content-Security-Policy (strict)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy (geolocation, microphone, camera disabled)
- [x] mTLS between services (via service mesh, optional)
- [x] Network policies (Kubernetes, deny-all by default)
- [x] VPC endpoints for AWS services (no internet egress)

## 5. Audit & Monitoring

- [x] Hash-chained audit log (cryptographic non-repudiation)
- [x] KMS-signed chain anchors (every 24h)
- [x] Audit chain integrity verification (automated daily)
- [x] 10-year audit log retention
- [x] S3 Object Lock (WORM) for audit logs
- [x] CloudWatch alarms (CPU, storage, WAF blocks)
- [x] Security event detection (brute force, privilege escalation, bulk export)
- [x] GuardDuty (threat detection)
- [x] Security Hub (security posture)
- [x] Sentry (error monitoring)
- [x] PagerDuty (24/7 on-call)
- [x] Incident Response Plan (tested quarterly)
- [x] Audit trail for all data access (who, when, what, IP)

## 6. Data Privacy

- [x] Granular consent management v2 (6 purposes, per-purpose revocation)
- [x] Right to be forgotten pipeline (verifiable deletion)
- [x] Data subject request API (access, erasure, portability, rectification)
- [x] Data classification tags (public, internal, confidential, restricted)
- [x] PII detection (PAN, Aadhaar, IFSC, GSTIN, credit card, email, phone)
- [x] PII redaction in logs and analytics
- [x] Anonymization for analytics (hashing, generalization, suppression)
- [x] K-anonymity for analytics datasets
- [x] Data residency per tenant (ap-south-1, eu-west-1, us-east-1)
- [x] Data localization for India (RBI compliant)
- [x] Cross-border transfer restrictions (DPDP Act)
- [x] Configurable retention policies per resource type
- [x] Records of Processing Activities (GDPR Art. 30)
- [x] Data Processing Agreement (DPA)
- [x] Sub-processor list with 30-day change notice
- [x] 72-hour breach notification (DPDP, GDPR)
- [x] 24-hour RBI notification for regulated entities

## 7. Application Security

- [x] Input validation (Zod schemas on all API endpoints)
- [x] SQL injection protection (Prisma ORM, parameterized queries)
- [x] XSS protection (React JSX escaping)
- [x] CSRF protection (Origin header validation + SameSite cookies)
- [x] Rate limiting (per-IP, per-API-key, per-tenant)
- [x] Secure cookies (httpOnly, secure, sameSite=lax)
- [x] File upload validation (type, size, hash dedup)
- [x] SAST (SonarCloud, ESLint security rules)
- [x] DAST (OWASP ZAP in CI)
- [x] SCA (Dependabot, Snyk)
- [x] Container scanning (Trivy)
- [x] Secret scanning (GitHub Secret Scanning, TruffleHog)
- [x] IaC scanning (tfsec, Checkov)
- [x] Code review (mandatory peer review)
- [x] Branch protection (no direct pushes to main)
- [x] Signed commits (GPG)
- [x] Reproducible builds (Docker image digests)

## 8. Infrastructure Security

- [x] Infrastructure as Code (Terraform)
- [x] Terraform state encryption (S3 + KMS)
- [x] Terraform state locking (DynamoDB)
- [x] EKS cluster (private API endpoint)
- [x] KMS-encrypted Kubernetes secrets
- [x] Pod Security Standards (restricted)
- [x] Network policies (Calico)
- [x] RBAC for Kubernetes API
- [x] Read-only root filesystem (containers)
- [x] Non-root containers (runAsNonRoot)
- [x] Drop all capabilities
- [x] Resource quotas and limit ranges
- [x] Pod anti-affinity (multi-AZ spread)
- [x] Topology spread constraints
- [x] Horizontal Pod Autoscaler
- [x] Pod Disruption Budget
- [x] Multi-AZ RDS (sync replication)
- [x] Cross-region RDS read replica (DR)
- [x] S3 cross-region replication (DR)
- [x] Encrypted EBS volumes
- [x] EKS audit logs (CloudWatch)
- [x] AWS Config (compliance monitoring)

## 9. Backup & Recovery

- [x] Daily RDS snapshots (30-day retention)
- [x] Weekly full backups (90-day retention)
- [x] Monthly archives (7-year retention per RBI)
- [x] S3 versioning (recoverable)
- [x] S3 Object Lock (WORM for audit logs, 10-year)
- [x] Cross-region backup replication
- [x] Automated backup verification (monthly restore test)
- [x] DR runbook (documented procedure)
- [x] Quarterly DR drill
- [x] RPO < 15 min
- [x] RTO < 4 hr
- [x] Backup encryption (KMS)

## 10. Compliance

- [x] SOC 2 Type II (in progress, Q3 2025 target)
- [x] ISO 27001:2022 (in progress, Q4 2025 target)
- [x] DPDP Act 2023 (certified)
- [x] GDPR (certified)
- [x] RBI Master Direction on Outsourcing (certified)
- [x] ISO 27017:2015 (cloud security, in progress)
- [x] ISO 27018:2019 (PII in clouds, in progress)
- [x] Quarterly penetration tests (CERT-In empaneled auditor)
- [x] Annual security awareness training
- [x] Background checks for all employees
- [x] Cyber liability insurance ($5M+)
- [x] Bug bounty program
- [x] Vendor security assessment (200-question template)
- [x] Vendor security questionnaire (bank-grade)
- [x] DPA template
- [x] SLA (99.95% uptime)
- [x] Incident Response Plan
- [x] Privacy Policy
- [x] Terms of Service

## 11. Secrets Management

- [x] No secrets in source code
- [x] No .env files in production
- [x] AWS Secrets Manager for all secrets
- [x] Secrets encrypted with KMS
- [x] Secret rotation (automated for DB, manual for others)
- [x] External Secrets Operator (syncs to Kubernetes)
- [x] IRSA (no static AWS credentials in pods)
- [x] Git-secrets pre-commit hook
- [x] Secret scanning in CI

## 12. Container Security

- [x] Minimal base image (alpine)
- [x] Non-root user
- [x] Read-only root filesystem
- [x] No privileged containers
- [x] Drop all Linux capabilities
- [x] seccomp profile (RuntimeDefault)
- [x] Container scanning (Trivy in CI)
- [x] Image signing (cosign)
- [x] Image pull policy (IfNotPresent)
- [x] Resource limits (QoS Guaranteed)

## 13. CI/CD Security

- [x] Signed commits required
- [x] Branch protection (no direct push to main)
- [x] Required code review (1+ approval)
- [x] CI checks must pass before merge
- [x] Secrets not exposed in CI logs
- [x] Least-privilege CI IAM role
- [x] Ephemeral CI runners
- [x] Build artifacts signed
- [x] Deploy approval (manual for production)
- [x] Blue-green deployment (zero-downtime)
- [x] Automated rollback on health check failure

## 14. Logging & Observability

- [x] Structured logging (JSON)
- [x] Log levels (debug, info, warn, error)
- [x] No sensitive data in logs (PII redaction)
- [x] Centralized log aggregation (CloudWatch)
- [x] Log retention (1 year app, 10 years audit)
- [x] Distributed tracing (AWS X-Ray)
- [x] Metrics (CloudWatch, Prometheus)
- [x] Dashboards (Grafana)
- [x] Alerting (PagerDuty, SNS)
- [x] SLO monitoring (uptime, latency, error rate)

## 15. Third-Party Risk Management

- [x] Vendor security assessment (annual)
- [x] Sub-processor list (public, 30-day change notice)
- [x] DPA with all sub-processors
- [x] Annual review of vendor SOC 2 reports
- [x] Vendor incident notification (within 24h)
- [x] Right to audit vendors
- [x] Vendor offboarding (data return/deletion)

---

## Verification

This checklist is verified:
- Monthly by the Engineering team lead
- Quarterly by the Security team
- Annually by external auditor (for SOC 2 / ISO 27001)

**Last verified:** January 1, 2025
**Next verification:** February 1, 2025
