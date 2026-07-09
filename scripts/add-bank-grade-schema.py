#!/usr/bin/env python3
"""
Add bank-grade schema additions to both SQLite and PostgreSQL Prisma schemas.
Adds: Tenant, Role, Permission, ApiKey, Webhook, SsoConnection, EncryptionKey,
DataProcessingRecord, DataSubjectRequest, BulkJob, WhiteLabelConfig, etc.
"""
import re
from pathlib import Path

SCHEMA_DIR = Path("/home/z/my-project/prisma")
SQLITE_SCHEMA = SCHEMA_DIR / "schema.prisma"
POSTGRES_SCHEMA = SCHEMA_DIR / "schema.postgres.prisma"

# New models block — identical content appended to both schemas
NEW_MODELS = r'''
// ============================================================
// BANK-GRADE MODELS — Multi-tenant, RBAC, SSO, Encryption, Compliance
// ============================================================

model Tenant {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  status          String   @default("active") // "active" | "suspended" | "trial" | "churned"
  plan            String   @default("enterprise") // "trial" | "nbfc" | "bank" | "enterprise"
  dataResidency   String   @default("ap-south-1") // AWS region for data localization
  currency        String   @default("INR")
  featuresJson    String?  // JSON: enabled feature flags
  mfaEnforced     Boolean  @default(true)
  ssoEnforced     Boolean  @default(false)
  ipAllowlistJson String?  // JSON: array of CIDR ranges
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users           UserRole[]
  apiKeys         ApiKey[]
  webhooks        Webhook[]
  ssoConnections  SsoConnection[]
  whiteLabel      WhiteLabelConfig?
  taxRules        TaxRuleOverride[]
  auditEntries    AuditChainEntry[]
  dataRequests    DataSubjectRequest[]
  processingRecords DataProcessingRecord[]
  bulkJobs        BulkJob[]
  consents        ConsentRecord[]
  retentionPolicies RetentionPolicy[]
  coreBankingSyncs CoreBankingSync[]
  incidentReports IncidentReport[]
  backupRecords   BackupRecord[]

  @@index([status])
}

model Role {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // "tenant_admin" | "analyst" | "auditor" | "viewer" | "compliance_officer"
  description String?
  isSystem    Boolean  @default(false) // system roles cannot be deleted
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  permissions RolePermission[]
  users       UserRole[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

model Permission {
  id          String   @id @default(cuid())
  resource    String   // "documents" | "tax" | "portfolio" | "users" | "audit" | "settings"
  action      String   // "read" | "write" | "delete" | "export" | "admin"
  description String?
  roles       RolePermission[]

  @@unique([resource, action])
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
}

model UserRole {
  userId    String
  tenantId  String
  roleId    String
  assignedAt DateTime @default(now())
  assignedBy String?
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  role      Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, tenantId])
  @@index([tenantId])
  @@index([roleId])
}

model ApiKey {
  id            String    @id @default(cuid())
  tenantId      String
  name          String
  keyPrefix     String    // first 8 chars shown in UI
  keyHash       String    @unique // sha256 of full key
  scopesJson    String?   // JSON: ["documents:read","tax:read",...]
  rateLimitPerMin Int     @default(600)
  ipAllowlistJson String?
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  revokedAt     DateTime?
  createdBy     String
  createdAt     DateTime  @default(now())
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([keyHash])
}

model Webhook {
  id            String    @id @default(cuid())
  tenantId      String
  url           String
  eventsJson    String    // JSON: ["document.processed","tax.computed",...]
  secretHash    String    // HMAC signing secret (sha256)
  isActive      Boolean   @default(true)
  failureCount  Int       @default(0)
  lastDeliveryAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  deliveries    WebhookDelivery[]

  @@index([tenantId])
}

model WebhookDelivery {
  id           String   @id @default(cuid())
  webhookId    String
  eventId      String
  eventType    String
  payload      String
  statusCode   Int?
  responseMs   Int?
  success      Boolean  @default(false)
  attempt      Int      @default(1)
  deliveredAt  DateTime @default(now())
  webhook      Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@index([webhookId])
  @@index([eventType])
}

model SsoConnection {
  id              String   @id @default(cuid())
  tenantId        String
  provider        String   // "saml" | "oidc" | "azure_ad" | "okta" | "google"
  entityId        String?  // SAML Entity ID
  ssoUrl          String?  // SAML SSO URL
  sloUrl          String?  // SAML SLO URL
  x509Cert        String?  // SAML signing cert (PEM)
  metadataXml     String?  // Raw IdP metadata XML
  oidcIssuer      String?  // OIDC issuer URL
  oidcClientId    String?
  oidcClientSecretEnc String? // encrypted with KMS
  oidcDiscoveryUrl String?
  jitProvisioning Boolean  @default(true) // auto-create users on first login
  scimEndpoint    String?
  scimTokenEnc    String?  // encrypted SCIM bearer token
  domainsJson     String?  // JSON: ["bank.com"] — auto-route by email domain
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model EncryptionKey {
  id            String   @id @default(cuid())
  keyId         String   @unique // KMS key ID or local key alias
  tenantId      String?  // null = platform-wide key
  purpose       String   // "field_encryption" | "pdf_signing" | "webhook_signing" | "audit_chain"
  algorithm     String   @default("AES-256-GCM")
  status        String   @default("active") // "active" | "rotating" | "retired" | "compromised"
  version       Int      @default(1)
  wrappedKey    String?  // KMS-wrapped DEK (base64) — for envelope encryption
  publicCert    String?  // for signing keys (PEM)
  hsmKeyId      String?  // HSM slot key reference
  createdAt     DateTime @default(now())
  rotatedAt     DateTime?
  retiredAt     DateTime?

  @@index([tenantId])
  @@index([purpose, status])
}

model AuditChainEntry {
  id           String   @id @default(cuid())
  tenantId     String?
  userId       String?
  actorType    String   @default("user") // "user" | "api_key" | "system" | "sso"
  actorId      String?
  action       String
  resourceType String?
  resourceId   String?
  detailsJson  String?
  ipAddress    String?
  userAgent    String?
  requestHash  String?  // hash of request body for non-repudiation
  prevHash     String?  // hash of previous entry — chain
  entryHash    String   @unique // sha256(prevHash + canonical(entry))
  timestamp    DateTime @default(now())
  tenant       Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId, timestamp])
  @@index([userId])
  @@index([action])
  @@index([entryHash])
}

model ConsentRecord {
  id            String   @id @default(cuid())
  tenantId      String?
  userId        String
  purpose       String   // "document_processing" | "tax_analysis" | "analytics" | "marketing" | "ai_training" | "data_sharing"
  purposeVersion String  // semantic version of the purpose text
  consentText   String
  status        String   @default("granted") // "granted" | "revoked" | "expired"
  lawfulBasis   String   @default("consent") // GDPR: "consent" | "contract" | "legal_obligation" | "vital_interest" | "public_task" | "legitimate_interest"
  grantedAt     DateTime @default(now())
  revokedAt     DateTime?
  expiresAt     DateTime?
  evidence      String?  // JSON: { ip, userAgent, sessionId } — proof of consent
  tenant        Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([userId, purpose])
  @@index([tenantId])
}

model DataProcessingRecord {
  id              String   @id @default(cuid())
  tenantId        String
  activityName    String
  purpose         String
  dataCategoriesJson String // JSON: ["identity","financial","transaction"]
  dataSubjectsJson String  // JSON: ["customers","employees"]
  recipientsJson  String   // JSON: third-party recipients
  transferMechanism String? // " Adequacy decision" | "SCCs" | "BCRs"
  retentionPeriod String   // "7 years" — RBI requirement
  lawfulBasis     String
  dpiCompleted    Boolean  @default(false)
  riskLevel       String   @default("medium") // "low" | "medium" | "high"
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model DataSubjectRequest {
  id            String   @id @default(cuid())
  tenantId      String
  userId        String?
  requestType   String   // "access" | "erasure" | "portability" | "rectification" | "restriction" | "objection"
  status        String   @default("received") // "received" | "verifying" | "in_progress" | "completed" | "rejected"
  email         String
  description   String?
  verifiedAt    DateTime?
  completedAt   DateTime?
  rejectionReason String?
  artifactsJson String?  // JSON: list of exported files or deletion receipts
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, status])
  @@index([userId])
}

model BulkJob {
  id            String   @id @default(cuid())
  tenantId      String
  jobType       String   // "bulk_document_upload" | "bulk_tax_compute" | "core_banking_export"
  status        String   @default("queued") // "queued" | "processing" | "completed" | "failed" | "cancelled"
  totalItems    Int      @default(0)
  processedItems Int     @default(0)
  failedItems   Int      @default(0)
  inputUri      String?  // S3 key for input manifest
  outputUri     String?  // S3 key for output
  errorMessage   String?
  metadataJson  String?
  startedAt     DateTime?
  completedAt   DateTime?
  createdBy     String
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, status])
}

model WhiteLabelConfig {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  appName       String
  primaryColor  String   @default("#0F172A")
  accentColor   String   @default("#6366F1")
  logoUrl       String?
  faviconUrl    String?
  customDomain  String?
  customCssUrl  String?
  emailFromName String?
  emailFromAddr String?
  hideBranding  Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}

model TaxRuleOverride {
  id            String   @id @default(cuid())
  tenantId      String
  ruleKey       String   // e.g. "80c_limit" | "standard_deduction" | "cess_rate"
  ruleValueJson String   // JSON value
  financialYear String   @default("2024-25")
  notes         String?
  effectiveFrom DateTime @default(now())
  effectiveTo   DateTime?
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, ruleKey, financialYear])
  @@index([tenantId])
}

model RetentionPolicy {
  id            String   @id @default(cuid())
  tenantId      String
  resourceType  String   // "documents" | "audit_logs" | "tax_records" | "consents"
  retentionDays Int      // e.g. 2555 for 7 years (RBI)
  action        String   @default("delete") // "delete" | "anonymize" | "archive"
  jurisdiction  String   @default("IN")
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, resourceType, jurisdiction])
}

model CoreBankingSync {
  id            String   @id @default(cuid())
  tenantId      String
  system        String   // "flexcube" | "finacle" | "tcs_bancs" | "custom"
  endpoint      String
  authMethod    String   // "oauth2" | "mtls" | "api_key"
  credentialsEnc String? // encrypted credentials blob
  lastSyncAt    DateTime?
  lastStatus    String?  // "success" | "failed" | "partial"
  lastError     String?
  scheduleCron  String?  // e.g. "0 2 * * *"
  isActive      Boolean  @default(false)
  createdAt     DateTime @default(now())
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model IncidentReport {
  id            String   @id @default(cuid())
  tenantId      String?
  title         String
  severity      String   // "P0" | "P1" | "P2" | "P3"
  status        String   @default("open") // "open" | "investigating" | "contained" | "resolved" | "postmortem"
  description   String
  affectedSystemsJson String?
  rootCause     String?
  resolution    String?
  reporterId    String?
  assignedTo    String?
  detectedAt    DateTime @default(now())
  containedAt   DateTime?
  resolvedAt    DateTime?
  notificationSentAt DateTime?
  createdAt     DateTime @default(now())
  tenant        Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId, status])
  @@index([severity])
}

model BackupRecord {
  id            String   @id @default(cuid())
  tenantId      String?
  backupType    String   // "daily_snapshot" | "weekly_full" | "pre_migration"
  resourceType  String   // "database" | "documents" | "audit_chain"
  location      String   // S3 URI
  sizeBytes     Int
  checksum      String   // sha256
  encrypted     Boolean  @default(true)
  retentionDays Int      @default(30)
  expiresAt     DateTime?
  verified      Boolean  @default(false)
  createdAt     DateTime @default(now())
  tenant        Tenant?  @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([createdAt])
}

model DataClassificationTag {
  id            String   @id @default(cuid())
  resourceType  String   // "document" | "extracted_field" | "income"
  resourceId    String
  classification String  // "public" | "internal" | "confidential" | "restricted"
  piiCategoriesJson String? // JSON: ["pan","aadhaar","account_number","ifsc"]
  anonymized    Boolean  @default(false)
  taggedAt      DateTime @default(now())
  taggedBy      String?  // "ml_model:v1" | userId

  @@index([resourceType, resourceId])
  @@index([classification])
}

model SecurityEvent {
  id            String   @id @default(cuid())
  eventType     String   // "failed_login" | "privilege_escalation" | "rate_limit_hit" | "suspicious_export"
  severity      String   @default("info") // "info" | "low" | "medium" | "high" | "critical"
  tenantId      String?
  userId        String?
  ipAddress     String?
  detailsJson   String?
  detectedAt    DateTime @default(now())
  resolved      Boolean  @default(false)
  resolvedAt    DateTime?
  resolutionNotes String?

  @@index([tenantId, detectedAt])
  @@index([eventType])
  @@index([severity])
}
'''

def update_schema(schema_path: Path):
    content = schema_path.read_text()

    # Check if already updated
    if "model Tenant" in content:
        print(f"  ⚠ Tenant model already exists in {schema_path.name}, skipping")
        return False

    # 1. Add tenantId field to User model (optional, with default for backward compat)
    user_model_pattern = r'(model User \{[^}]+?role\s+String\s+@default\("user"\)[^\n]*\n)'
    user_replacement = r'\1  tenantId        String?  // null = personal user (no org)\n'

    if 'tenantId' not in content:
        content = re.sub(
            user_model_pattern,
            user_replacement,
            content,
            count=1
        )
        # Add Tenant relation to User
        content = content.replace(
            '  refreshTokens        RefreshToken[]\n}',
            '  refreshTokens        RefreshToken[]\n  tenantRoles       UserRole[]\n}'
        )

    # 2. Append new models
    content = content.rstrip() + "\n" + NEW_MODELS

    schema_path.write_text(content)
    print(f"  ✓ Updated {schema_path.name}")
    return True

if __name__ == "__main__":
    print("Adding bank-grade models to schemas...")
    update_schema(SQLITE_SCHEMA)
    update_schema(POSTGRES_SCHEMA)
    print("Done.")
