#!/usr/bin/env python3
"""Add Entity models to Prisma schemas (SQLite + Postgres)."""
from pathlib import Path

ENTITY_MODELS = '''
// ============================================================
// ENTITY PORTAL MODELS — Business/Institution tenants
// ============================================================

model Entity {
  id              String   @id @default(cuid())
  tenantId        String   // Owning tenant (the institution)
  name            String
  legalName       String?
  entityType      String   // EntityType enum value
  industrySector  String?
  pan             String?
  gstin           String?
  cin             String?  // Corporate Identity Number (for companies)
  tan             String?  // Tax Deduction Account Number
  incorporationDate DateTime?
  financialYearStart Int   @default(4) // April=4 (Indian FY)
  registeredState String?  // Indian state code for GST/PT
  registeredAddress String?
  city            String?
  pincode         String?
  contactEmail    String?
  contactPhone    String?
  website         String?
  turnoverLastYear Float?  // Annual turnover (₹)
  netWorth        Float?
  isActive        Boolean  @default(true)
  metadataJson    String?  // JSON: extra config (e.g., MSME Udyam no., RERA reg no.)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  taxProfiles     EntityTaxProfile[]
  filings         EntityFiling[]
  documents       EntityDocument[]
  teamMembers     EntityTeamMember[]
  transactions    EntityTransaction[]
  notices         EntityNotice[]

  @@unique([tenantId, name])
  @@unique([pan]) // PAN is unique per entity
  @@index([tenantId])
  @@index([entityType])
  @@index([gstin])
}

model EntityTaxProfile {
  id              String   @id @default(cuid())
  entityId        String
  financialYear   String
  regime          String   // "cit_new_115baa" | "cit_default" | "llp_flat" | etc.
  grossIncome     Float
  totalDeductions Float
  taxableIncome   Float
  incomeTax       Float
  gstPayable      Float
  tdsDeducted     Float
  advanceTaxPaid  Float
  netTaxPayable   Float
  totalTaxBurden  Float
  effectiveTaxRate Float
  breakdownJson   String?  // Full EntityTaxBreakdown as JSON
  computedAt      DateTime @default(now())
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@unique([entityId, financialYear])
  @@index([entityId])
}

model EntityFiling {
  id              String   @id @default(cuid())
  entityId        String
  filingId        String   // Reference to compliance-calendar filing ID
  filingName      String
  form            String
  financialYear   String?
  period          String?  // "2024-07" for monthly, "2024-Q1" for quarterly
  dueDate         DateTime
  filedDate       DateTime?
  status          String   @default("pending") // "pending" | "filed" | "overdue" | "cancelled"
  acknowledgmentNumber String? // Receipt no. from govt portal
  filedBy         String?  // userId
  notes           String?
  documentsJson   String?  // JSON: list of attached document IDs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@index([entityId, status])
  @@index([entityId, dueDate])
  @@index([filingId])
}

model EntityDocument {
  id              String   @id @default(cuid())
  entityId        String
  documentType    String   // "gstr_1" | "gstr_3b" | "tds_certificate" | "audit_report" | "notice" | "invoice" | etc.
  fileName        String
  filePath        String
  fileSizeBytes   Int
  mimeType        String
  fileHash        String
  financialYear   String?
  period          String?
  description     String?
  uploadedBy      String?
  isVerified      Boolean  @default(false)
  metadataJson    String?
  createdAt       DateTime @default(now())
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@unique([entityId, fileHash])
  @@index([entityId, documentType])
  @@index([entityId, financialYear])
}

model EntityTeamMember {
  id              String   @id @default(cuid())
  entityId        String
  userId          String
  role            String   // "tenant_admin" | "compliance_officer" | "analyst" | "auditor" | "viewer"
  invitedBy       String?
  invitedAt       DateTime @default(now())
  acceptedAt      DateTime?
  isActive        Boolean  @default(true)
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@unique([entityId, userId])
  @@index([entityId])
  @@index([userId])
}

model EntityTransaction {
  id              String   @id @default(cuid())
  entityId        String
  transactionType String   // "sale" | "purchase" | "expense" | "tds_deducted" | "tcs_collected" | "advance_tax" | "gst_paid" | "refund"
  amount          Float
  date            DateTime
  counterparty    String?
  counterpartyPan String?
  description     String?
  gstRate         Float?
  gstAmount       Float?
  tdsSection      String?
  tdsAmount       Float?
  tcsSection      String?
  tcsAmount       Float?
  invoiceNumber   String?
  invoiceDate     DateTime?
  isGstRegistered Boolean  @default(false)
  metadataJson    String?
  createdAt       DateTime @default(now())
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@index([entityId, transactionType])
  @@index([entityId, date])
  @@index([counterpartyPan])
}

model EntityNotice {
  id              String   @id @default(cuid())
  entityId        String
  noticeType      String   // "scrutiny_143(2)" | "demand_156" | "assessment_143(3)" | "penalty_271" | "gst_notice" | "tds_notice"
  noticeNumber    String?
  din             String?  // Document Identification Number (mandatory since Oct 2019)
  issuedBy        String?  // "CIT" | "DCIT" | "ACIT" | "ITO" | "GST_OFFICER"
  issuedDate      DateTime
  dueDate         DateTime?
  amountDemand    Float?
  status          String   @default("received") // "received" | "responded" | "appealed" | "resolved" | "disputed"
  responseDate    DateTime?
  responseSummary String?
  appealDate      DateTime?
  appealForum     String?  // "CIT(A)" | "ITAT" | "HC" | "SC"
  documentsJson   String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  entity          Entity   @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@index([entityId, status])
  @@index([entityId, issuedDate])
}
'''

def update_schema(schema_path: Path) -> bool:
    content = schema_path.read_text()
    if "model Entity {" in content:
        print(f"  ⚠ Entity model already exists in {schema_path.name}")
        return False
    content = content.rstrip() + "\n" + ENTITY_MODELS
    schema_path.write_text(content)
    print(f"  ✓ Updated {schema_path.name}")
    return True

if __name__ == "__main__":
    print("Adding Entity models to schemas...")
    update_schema(Path("/home/z/my-project/prisma/schema.prisma"))
    update_schema(Path("/home/z/my-project/prisma/schema.postgres.prisma"))
    print("Done.")
