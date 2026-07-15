/**
 * Document Extraction Pipeline
 * ----------------------------
 * Uses z-ai-web-dev-sdk VLM (Vision Language Model) to extract structured
 * data from uploaded financial documents.
 *
 * Supported document types:
 *   - PAN card
 *   - Aadhaar card
 *   - Form 16 / 16A
 *   - Bank statement (CSV/PDF)
 *   - AIS / TIS
 *   - Rent receipt
 *   - Insurance premium receipt
 *   - Investment proof (80C)
 *   - Home loan certificate
 *   - GST return
 *   - TDS certificate
 *   - Salary slip
 *
 * Each parser:
 *   1. Sends document to VLM with a type-specific prompt
 *   2. Parses VLM response into structured fields
 *   3. Assigns confidence scores
 *   4. Extracts source snippets for verification
 *   5. Auto-classifies PII for encryption
 */

import { db } from "../db";
import { appendAuditEntry } from "../security/audit-chain";
import { detectPiiCategory, encryptField } from "../security/field-encryption";
import { tagResource } from "../compliance/data-classification";

export type DocumentType =
  | "pan_card"
  | "aadhaar_card"
  | "form_16"
  | "form_16a"
  | "bank_statement"
  | "ais_tis"
  | "rent_receipt"
  | "insurance_receipt"
  | "investment_proof"
  | "home_loan_certificate"
  | "gst_return"
  | "tds_certificate"
  | "salary_slip"
  | "unknown";

export interface ExtractedFieldResult {
  fieldName: string;
  fieldValue: string;
  confidenceScore: number; // 0-1
  sourceSnippet?: string;
  verifiedByUser?: boolean;
}

export interface ExtractionResult {
  documentType: DocumentType;
  detectedType: DocumentType;
  fields: ExtractedFieldResult[];
  rawText?: string;
  tables?: any[];
  confidenceScore: number; // overall 0-1
  piiCategories: string[];
}

/**
 * VLM prompts for each document type.
 * These tell the vision model what fields to extract.
 */
const EXTRACTION_PROMPTS: Record<DocumentType, string> = {
  pan_card: `Extract the following fields from this PAN card image:
- name: Full name of the PAN holder
- father_name: Father's name
- pan_number: 10-character PAN number (format: ABCDE1234F)
- date_of_birth: Date of birth (DD/MM/YYYY)

Return as JSON: {"name": "", "father_name": "", "pan_number": "", "date_of_birth": ""}`,

  aadhaar_card: `Extract the following fields from this Aadhaar card:
- name: Full name
- aadhaar_number: 12-digit Aadhaar number (mask middle 8 digits: XXXX-XXXX-1234)
- date_of_birth: DOB if visible
- address: Address if visible
- gender: Gender if visible

Return as JSON: {"name": "", "aadhaar_number": "", "date_of_birth": "", "address": "", "gender": ""}`,

  form_16: `Extract the following from this Form 16 (salary TDS certificate):
- employer_name: Employer name
- employer_pan: Employer PAN
- employer_tan: Employer TAN
- employee_name: Employee name
- employee_pan: Employee PAN
- assessment_year: Assessment year (e.g., 2024-25)
- gross_salary: Gross salary (number)
- deductions_80c: Section 80C deductions
- deductions_80d: Section 80D deductions
- tds_deducted: Total TDS deducted
- tax_payable: Total tax payable

Return as JSON with all numeric fields as numbers.`,

  form_16a: `Extract the following from this Form 16A (non-salary TDS certificate):
- deductor_name: Deductor name
- deductor_tan: Deductor TAN
- deductee_name: Deductee name
- deductee_pan: Deductee PAN
- section: TDS section (e.g., 194A, 194C, 194J)
- amount_paid: Amount paid/credited
- tds_deducted: TDS deducted
- assessment_year: Assessment year

Return as JSON with numeric fields as numbers.`,

  bank_statement: `Extract transaction data from this bank statement.
For each transaction, extract:
- date: Transaction date (DD/MM/YYYY or DD-MM-YYYY)
- description: Transaction description/narration
- amount: Transaction amount (number, positive for credit, negative for debit)
- balance: Running balance after transaction (number)

Also extract:
- account_number: Bank account number
- bank_name: Bank name
- ifsc_code: IFSC code
- statement_period: Period (from-to)

Return as JSON: {"account_number": "", "bank_name": "", "ifsc_code": "", "statement_period": "", "transactions": [{"date": "", "description": "", "amount": 0, "balance": 0}]}`,

  ais_tis: `Extract income information from this AIS (Annual Information Statement):
- salary: Salary income
- interest: Interest income
- dividend: Dividend income
- capital_gains_stcg: Short-term capital gains
- capital_gains_ltcg: Long-term capital gains
- rental_income: Rental income
- other_income: Other income sources

Return as JSON with numeric fields as numbers.`,

  rent_receipt: `Extract from this rent receipt:
- tenant_name: Tenant name
- landlord_name: Landlord name
- rent_amount: Monthly rent amount (number)
- period: Rent period (month/year)
- address: Property address
- landlord_pan: Landlord PAN (if available)

Return as JSON.`,

  insurance_receipt: `Extract from this insurance premium receipt:
- insurer_name: Insurance company name
- policy_number: Policy number
- premium_amount: Premium amount (number)
- premium_date: Payment date
- insured_name: Name of insured
- policy_type: Type (life/health/general)

Return as JSON.`,

  investment_proof: `Extract from this investment proof (80C):
- investment_type: Type (ELSS/PPF/NSC/LIC/Home Loan Principal/NPS)
- amount: Investment amount (number)
- date: Investment date
- institution: Institution/fund house
- folio_number: Folio/account number

Return as JSON.`,

  home_loan_certificate: `Extract from this home loan interest certificate:
- bank_name: Bank name
- borrower_name: Borrower name
- loan_account_number: Loan account number
- principal_amount: Principal paid (number)
- interest_amount: Interest paid (number)
- financial_year: Financial year

Return as JSON with numeric fields as numbers.`,

  gst_return: `Extract from this GST return:
- gstin: GSTIN
- return_type: Return type (GSTR-1/3B/9)
- financial_period: Tax period (e.g., "April 2024")
- total_turnover: Total turnover (number)
- output_tax: Output tax liability (number)
- input_tax_credit: ITC claimed (number)
- net_tax_payable: Net tax payable (number)

Return as JSON with numeric fields as numbers.`,

  tds_certificate: `Extract from this TDS certificate (Form 16/16A):
- deductor_name: Name of deductor
- deductor_tan: TAN of deductor
- deductee_name: Name of deductee
- deductee_pan: PAN of deductee
- section: TDS section
- amount: Amount on which TDS deducted
- tds_amount: TDS amount
- quarter: Quarter (Q1/Q2/Q3/Q4)
- assessment_year: Assessment year

Return as JSON with numeric fields as numbers.`,

  salary_slip: `Extract from this salary slip:
- employer_name: Employer name
- employee_name: Employee name
- employee_id: Employee ID
- month: Month and year
- basic_salary: Basic salary (number)
- hra: HRA received (number)
- special_allowance: Special allowance (number)
- gross_salary: Gross salary (number)
- pf_deduction: PF deduction (number)
- tds_deduction: TDS deduction (number)
- net_salary: Net salary (number)

Return as JSON with all numeric fields as numbers.`,

  unknown: `Identify this document and extract all visible financial information.
Return as JSON with any fields you can identify.`,
};

/**
 * Detect document type from file content.
 * Uses VLM to classify the document.
 */
export async function detectDocumentType(
  fileBuffer: Buffer,
  mimeType: string
): Promise<DocumentType> {
  // For images, use VLM to detect type
  if (mimeType.startsWith("image/")) {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const base64Image = fileBuffer.toString("base64");
      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify this document type. Respond with ONLY one of: pan_card, aadhaar_card, form_16, form_16a, bank_statement, ais_tis, rent_receipt, insurance_receipt, investment_proof, home_loan_certificate, gst_return, tds_certificate, salary_slip, unknown",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });

      const result = response.choices[0]?.message?.content?.trim().toLowerCase() || "unknown";
      if (isValidDocumentType(result)) {
        return result as DocumentType;
      }
    } catch (err) {
      console.error("VLM detection failed:", err);
    }
  }

  // For PDFs and text files, use keyword detection
  const text = fileBuffer.toString("utf-8").toLowerCase();
  if (text.includes("permanent account number") || text.includes("pan card")) return "pan_card";
  if (text.includes("aadhaar") || text.includes("uid")) return "aadhaar_card";
  if (text.includes("form 16") && text.includes("salary")) return "form_16";
  if (text.includes("form 16a") || text.includes("tds certificate")) return "form_16a";
  if (text.includes("bank statement") || text.includes("account statement")) return "bank_statement";
  if (text.includes("annual information statement") || text.includes("ais")) return "ais_tis";
  if (text.includes("rent receipt")) return "rent_receipt";
  if (text.includes("insurance premium")) return "insurance_receipt";
  if (text.includes("investment proof") || text.includes("80c")) return "investment_proof";
  if (text.includes("home loan") && text.includes("interest")) return "home_loan_certificate";
  if (text.includes("gstr") || text.includes("gst return")) return "gst_return";
  if (text.includes("salary slip") || text.includes("payslip")) return "salary_slip";

  return "unknown";
}

/**
 * Extract structured data from a document using VLM.
 */
export async function extractDocumentData(
  fileBuffer: Buffer,
  mimeType: string,
  documentType: DocumentType,
  fileName: string
): Promise<ExtractionResult> {
  const detectedType = documentType === "unknown"
    ? await detectDocumentType(fileBuffer, mimeType)
    : documentType;

  const prompt = EXTRACTION_PROMPTS[detectedType] || EXTRACTION_PROMPTS.unknown;

  let extractedData: Record<string, any> = {};
  let rawText = "";

  // Use VLM for images and PDFs
  if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      const base64Data = fileBuffer.toString("base64");
      const response = await zai.chat.completions.createVision({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
            ],
          },
        ],
        thinking: { type: "disabled" },
      });

      rawText = response.choices[0]?.message?.content || "";
      // Parse JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("VLM extraction failed:", err);
    }
  } else if (mimeType === "text/csv" || mimeType === "application/vnd.ms-excel") {
    // CSV parsing for bank statements
    if (detectedType === "bank_statement" || fileName.toLowerCase().includes("statement")) {
      extractedData = parseCsvBankStatement(fileBuffer.toString("utf-8"));
      rawText = fileBuffer.toString("utf-8");
    }
  }

  // Convert extracted data to field results
  const fields: ExtractedFieldResult[] = [];
  const piiCategories: string[] = [];

  for (const [key, value] of Object.entries(extractedData)) {
    if (value === null || value === undefined || value === "") continue;

    const strValue = String(value);
    const piiCategory = detectPiiCategory(strValue);
    if (piiCategory) {
      piiCategories.push(piiCategory);
    }

    fields.push({
      fieldName: key,
      fieldValue: strValue,
      confidenceScore: 0.85, // VLM confidence — could be improved with model output
      sourceSnippet: rawText.substring(
        Math.max(0, rawText.indexOf(strValue) - 50),
        rawText.indexOf(strValue) + strValue.length + 50
      ) || undefined,
    });
  }

  // Overall confidence
  const overallConfidence = fields.length > 0
    ? fields.reduce((sum, f) => sum + f.confidenceScore, 0) / fields.length
    : 0;

  return {
    documentType: detectedType,
    detectedType,
    fields,
    rawText: rawText.substring(0, 50000), // cap at 50KB
    confidenceScore: overallConfidence,
    piiCategories,
  };
}

/**
 * Parse CSV bank statement into structured transactions.
 */
function parseCsvBankStatement(csvText: string): Record<string, any> {
  try {
    // Simple CSV parsing — production should use papaparse
    const lines = csvText.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return {};

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const transactions: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const txn: any = {};
      headers.forEach((header, idx) => {
        txn[header] = cols[idx]?.trim() || "";
      });
      transactions.push(txn);
    }

    return {
      transactions,
      account_number: "",
      bank_name: "",
      ifsc_code: "",
      statement_period: "",
    };
  } catch {
    return {};
  }
}

/**
 * Process a document: extract fields + store in DB + tag PII + audit.
 */
export async function processDocument(
  documentId: string,
  userId: string,
  tenantId: string | null
): Promise<ExtractionResult> {
  // 1. Fetch document from DB
  const doc = await db.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  // 2. Fetch file from storage
  const { getFileStore } = await import("../storage/file-store");
  const store = await getFileStore();
  const fileBuffer = await store.read(doc.filePath);

  // 3. Detect document type if not specified
  const detectedType = doc.detectedDocType as DocumentType || "unknown";
  const documentType = detectedType === "unknown"
    ? await detectDocumentType(fileBuffer, doc.mimeType)
    : detectedType;

  // 4. Extract data
  const result = await extractDocumentData(
    fileBuffer,
    doc.mimeType,
    documentType,
    doc.fileName
  );

  // 5. Update document record
  await db.document.update({
    where: { id: documentId },
    data: {
      processingStatus: "completed",
      confidenceScore: result.confidenceScore,
      detectedDocType: result.detectedType,
      rawText: result.rawText?.substring(0, 50000),
    },
  });

  // 6. Store extracted fields (encrypt PII)
  for (const field of result.fields) {
    const piiCategory = detectPiiCategory(field.fieldValue);
    const encryptedValue = piiCategory
      ? await encryptField(field.fieldValue)
      : field.fieldValue;

    await db.extractedField.create({
      data: {
        documentId,
        fieldName: field.fieldName,
        fieldValue: encryptedValue || field.fieldValue,
        confidenceScore: field.confidenceScore,
        verifiedByUser: false,
        sourceSnippet: field.sourceSnippet,
      },
    });

    // Tag PII if detected
    if (piiCategory) {
      await tagResource(
        "extracted_field",
        `${documentId}:${field.fieldName}`,
        piiCategory === "pan" || piiCategory === "aadhaar" ? "restricted" : "confidential",
        [piiCategory]
      );
    }
  }

  // 7. Auto-create income/expense/deduction records based on document type
  await autoCreateRecords(documentId, userId, result);

  // 8. Audit log
  await appendAuditEntry({
    tenantId,
    userId,
    actorType: "system",
    action: "document.processed",
    resourceType: "document",
    resourceId: documentId,
    details: {
      fileName: doc.fileName,
      detectedType: result.detectedType,
      fieldCount: result.fields.length,
      confidence: result.confidenceScore,
      piiCategories: result.piiCategories,
    },
  });

  return result;
}

/**
 * Auto-create income/expense/deduction records from extracted data.
 */
async function autoCreateRecords(
  documentId: string,
  userId: string,
  result: ExtractionResult
): Promise<void> {
  const fields: Record<string, string> = {};
  for (const f of result.fields) {
    fields[f.fieldName] = f.fieldValue;
  }

  const currentFY = new Date().getMonth() >= 3
    ? `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`
    : `${new Date().getFullYear() - 1}-${new Date().getFullYear().toString().slice(-2)}`;

  switch (result.detectedType) {
    case "form_16":
    case "salary_slip":
      if (fields.gross_salary || fields.gross_salary) {
        await db.income.create({
          data: {
            userId,
            incomeType: "salary",
            source: fields.employer_name || "Employer",
            amount: parseFloat(fields.gross_salary) || 0,
            month: new Date().getMonth() + 1,
            financialYear: currentFY,
            documentId,
            verified: false,
          },
        }).catch(() => {});
      }
      break;

    case "bank_statement":
      // Transactions would be created as expenses/income
      break;

    case "home_loan_certificate":
      if (fields.interest_amount) {
        await db.deduction.create({
          data: {
            userId,
            deductionType: "HomeLoanInterest",
            amount: parseFloat(fields.interest_amount) || 0,
            financialYear: currentFY,
            documentId,
            verified: false,
          },
        }).catch(() => {});
      }
      break;

    case "investment_proof":
      if (fields.amount) {
        await db.deduction.create({
          data: {
            userId,
            deductionType: fields.investment_type || "80C",
            amount: parseFloat(fields.amount) || 0,
            financialYear: currentFY,
            documentId,
            verified: false,
          },
        }).catch(() => {});
      }
      break;

    case "insurance_receipt":
      if (fields.premium_amount) {
        await db.deduction.create({
          data: {
            userId,
            deductionType: "80D",
            amount: parseFloat(fields.premium_amount) || 0,
            financialYear: currentFY,
            documentId,
            verified: false,
          },
        }).catch(() => {});
      }
      break;

    case "rent_receipt":
      if (fields.rent_amount) {
        await db.deduction.create({
          data: {
            userId,
            deductionType: "HRA",
            amount: parseFloat(fields.rent_amount) || 0,
            financialYear: currentFY,
            documentId,
            verified: false,
          },
        }).catch(() => {});
      }
      break;
  }
}

function isValidDocumentType(type: string): boolean {
  const validTypes: DocumentType[] = [
    "pan_card", "aadhaar_card", "form_16", "form_16a",
    "bank_statement", "ais_tis", "rent_receipt",
    "insurance_receipt", "investment_proof",
    "home_loan_certificate", "gst_return",
    "tds_certificate", "salary_slip", "unknown",
  ];
  return validTypes.includes(type as DocumentType);
}
