import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { createHash } from "crypto";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["salary_slip", "form16", "bank_statement", "rent_receipt", "insurance_receipt", "loan_certificate", "investment_statement", "other"];
const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".csv", ".xlsx"];

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const docs = await db.document.findMany({ where: { userId: payload.sub }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items: docs.map((d) => ({ id: d.id, document_type: d.documentType, file_name: d.fileName, file_size_bytes: d.fileSizeBytes, mime_type: d.mimeType, processing_status: d.processingStatus, confidence_score: d.confidenceScore, detected_doc_type: d.detectedDocType, created_at: d.createdAt, updated_at: d.updatedAt })), total: docs.length });
  } catch { return NextResponse.json({ detail: "Failed to fetch documents" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("document_type") as string;
    if (!file || !documentType) return NextResponse.json({ detail: "File and document_type required" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(documentType)) return NextResponse.json({ detail: "Invalid document type" }, { status: 400 });
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) return NextResponse.json({ detail: "File type not supported" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ detail: "File too large (max 10MB)" }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    // Dedup
    const existing = await db.document.findFirst({ where: { userId: payload.sub, fileHash } });
    if (existing) return NextResponse.json({ detail: "This file has already been uploaded." }, { status: 409 });

    // Save file OUTSIDE public/ — not web-accessible
    const uploadDir = path.join(process.cwd(), "uploads", payload.sub);
    await mkdir(uploadDir, { recursive: true });
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filePath = path.join(uploadDir, `${docId}${ext}`);
    await writeFile(filePath, buffer);

    // Create DB record
    const doc = await db.document.create({
      data: { userId: payload.sub, documentType, fileName: file.name, filePath: `uploads/${payload.sub}/${docId}${ext}`, fileHash, fileSizeBytes: file.size, mimeType: file.type || "application/octet-stream", processingStatus: "processing" },
    });

    await db.auditLog.create({ data: { userId: payload.sub, action: "document_uploaded", details: JSON.stringify({ document_id: doc.id, document_type: documentType }) } });

    // === REAL DOCUMENT PROCESSING (with proper error handling) ===
    let extractedText = "";
    let detectedType = documentType;
    let confidence = 0.5;

    try {
      if (ext === ".pdf") {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse(new Uint8Array(buffer));
        await parser.load();
        const result: any = await parser.getText();
        extractedText = result?.text || (typeof result === "string" ? result : "") || "";
      }

      // === BANK STATEMENT PARSING (CSV/XLSX) ===
      if (ext === ".csv" || ext === ".xlsx") {
        const { parseBankStatement, summarizeTransactions } = await import("@/lib/parsers/bank-statement");
        const result = parseBankStatement(buffer, file.name);
        if (result.transactions.length > 0) {
          detectedType = "bank_statement";
          confidence = 0.95;
          extractedText = `Bank: ${result.sourceFormat.toUpperCase()}\nTransactions: ${result.transactionCount}\nTotal Credits: ${result.totals.credits}\nTotal Debits: ${result.totals.debits}\nNet: ${result.totals.net}\n\nTop categories:\n${Object.entries(result.transactions.reduce((acc: any, t: any) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([k, v]: any) => `  ${k}: ₹${v.toFixed(0)}`).join("\n")}`;

          // Create extracted fields from bank statement summary
          const summary = summarizeTransactions(result.transactions, result.sourceFormat);
          const bankFields = [
            { name: "bank_name", value: result.sourceFormat.toUpperCase(), confidence: 0.95, snippet: `Detected from headers` },
            { name: "transaction_count", value: String(result.transactionCount), confidence: 1.0, snippet: `${result.transactionCount} rows parsed` },
            { name: "total_credits", value: String(Math.round(summary.totals.credits)), confidence: 0.95, snippet: `Sum of all credit transactions` },
            { name: "total_debits", value: String(Math.round(summary.totals.debits)), confidence: 0.95, snippet: `Sum of all debit transactions` },
            { name: "net_cash_flow", value: String(Math.round(summary.totals.net)), confidence: 0.95, snippet: `Credits minus debits` },
            { name: "month_detected", value: summary.monthDetected || "unknown", confidence: 0.85, snippet: `From first transaction date` },
          ];
          if (bankFields.length > 0) {
            await db.$transaction(
              bankFields.map((f) =>
                db.extractedField.create({ data: { documentId: doc.id, fieldName: f.name, fieldValue: f.value, confidenceScore: f.confidence, sourceSnippet: f.snippet } })
              )
            );
          }
          // Mark as extracted with high confidence
          await db.document.update({ where: { id: doc.id }, data: { processingStatus: "extracted", detectedDocType: detectedType, confidenceScore: confidence, rawText: extractedText.slice(0, 10000) } });
          await db.auditLog.create({ data: { userId: payload.sub, action: "bank_statement_parsed", details: JSON.stringify({ document_id: doc.id, transaction_count: result.transactionCount, bank: result.sourceFormat }) } });

          return NextResponse.json({ id: doc.id, document_type: doc.documentType, file_name: doc.fileName, file_size_bytes: doc.fileSizeBytes, mime_type: doc.mimeType, processing_status: "extracted", confidence_score: confidence, detected_doc_type: detectedType, created_at: doc.createdAt, updated_at: doc.updatedAt, transaction_count: result.transactionCount, totals: result.totals, source_format: result.sourceFormat }, { status: 201 });
        } else {
          confidence = 0.40;
          extractedText = "Could not parse bank statement — unknown format or empty file.";
        }
      }

      if (extractedText.length > 20) {
        const lowerText = extractedText.toLowerCase();
        if (lowerText.includes("form 16") || lowerText.includes("part a") || lowerText.includes("part b")) { detectedType = "form16"; confidence = 0.92; }
        else if (lowerText.includes("salary") || lowerText.includes("payslip") || lowerText.includes("net pay") || lowerText.includes("basic")) { detectedType = "salary_slip"; confidence = 0.90; }
        else if (lowerText.includes("statement") || lowerText.includes("opening balance") || lowerText.includes("closing balance")) { detectedType = "bank_statement"; confidence = 0.88; }
        else if (lowerText.includes("premium") || lowerText.includes("policy")) { detectedType = "insurance_receipt"; confidence = 0.85; }
        else if (lowerText.includes("interest certificate") || lowerText.includes("loan")) { detectedType = "loan_certificate"; confidence = 0.82; }
        else { confidence = 0.70; }

        // Extract fields using regex — wrap in transaction
        const fields = extractFields(extractedText, detectedType);
        if (fields.length > 0) {
          await db.$transaction(
            fields.map((f) =>
              db.extractedField.create({ data: { documentId: doc.id, fieldName: f.name, fieldValue: f.value, confidenceScore: f.confidence, sourceSnippet: f.snippet } })
            )
          );
        }
      } else {
        confidence = 0.40;
      }

      // Update document with results
      await db.document.update({ where: { id: doc.id }, data: { processingStatus: "extracted", detectedDocType: detectedType, confidenceScore: confidence, rawText: extractedText.slice(0, 10000) } });
    } catch (e) {
      // Mark as failed — don't leave stuck in "processing"
      await db.document.update({ where: { id: doc.id }, data: { processingStatus: "failed", errorMessage: "PDF parsing failed", confidenceScore: 0 } });
      return NextResponse.json({ id: doc.id, document_type: doc.documentType, file_name: doc.fileName, file_size_bytes: doc.fileSizeBytes, mime_type: doc.mimeType, processing_status: "failed", confidence_score: 0, detected_doc_type: documentType, created_at: doc.createdAt, updated_at: doc.updatedAt }, { status: 201 });
    }

    return NextResponse.json({ id: doc.id, document_type: doc.documentType, file_name: doc.fileName, file_size_bytes: doc.fileSizeBytes, mime_type: doc.mimeType, processing_status: "extracted", confidence_score: confidence, detected_doc_type: detectedType, created_at: doc.createdAt, updated_at: doc.updatedAt }, { status: 201 });
  } catch { return NextResponse.json({ detail: "Failed to upload document" }, { status: 500 }); }
}

// Regex-based field extraction
function extractFields(text: string, docType: string): { name: string; value: string; confidence: number; snippet: string }[] {
  const fields: { name: string; value: string; confidence: number; snippet: string }[] = [];
  const numPattern = /[\d,]+(?:\.\d+)?/;

  const tryExtract = (patterns: RegExp[], name: string) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const value = m[1].trim();
        const start = Math.max(0, m.index! - 30);
        const snippet = text.substring(start, m.index! + m[0].length + 30).replace(/\n/g, " ").trim();
        fields.push({ name, value, confidence: 0.90, snippet });
        return;
      }
    }
  };

  if (docType === "salary_slip") {
    tryExtract([/basic\s*salary\s*:?\s*([\d,]+)/i, /basic\s*:?\s*([\d,]+)/i], "basic_salary");
    tryExtract([/hra\s*:?\s*([\d,]+)/i, /house\s*rent\s*:?\s*([\d,]+)/i], "hra");
    tryExtract([/gross\s*salary\s*:?\s*([\d,]+)/i, /gross\s*:?\s*([\d,]+)/i], "gross_salary");
    tryExtract([/net\s*salary\s*:?\s*([\d,]+)/i, /net\s*pay\s*:?\s*([\d,]+)/i], "net_salary");
    tryExtract([/pf\s*:?\s*([\d,]+)/i, /provident\s*fund\s*:?\s*([\d,]+)/i], "pf_deduction");
    tryExtract([/employee\s*name\s*:?\s*([A-Za-z][A-Za-z\s.]+)/i], "employee_name");
    tryExtract([/month\s*:?\s*([A-Za-z]+\s+\d{4})/i], "month");
  } else if (docType === "form16") {
    tryExtract([/pan\s*:?\s*([A-Z]{5}\d{4}[A-Z])/i], "employee_pan");
    tryExtract([/tan\s*:?\s*([A-Z]{4}\d{5}[A-Z])/i], "employer_tan");
    tryExtract([/gross\s*salary\s*:?\s*([\d,]+)/i], "gross_salary");
    tryExtract([/taxable\s*income\s*:?\s*([\d,]+)/i], "taxable_income");
    tryExtract([/tds\s*:?\s*([\d,]+)/i, /tax\s*deducted\s*:?\s*([\d,]+)/i], "tds_deducted");
    tryExtract([/financial\s*year\s*:?\s*(\d{4}-\d{2})/i], "financial_year");
  } else if (docType === "bank_statement") {
    tryExtract([/account\s*(?:no|number)\s*:?\s*(\d{8,18})/i], "account_number");
    tryExtract([/opening\s*balance\s*:?\s*([\d,]+)/i], "opening_balance");
    tryExtract([/closing\s*balance\s*:?\s*([\d,]+)/i], "closing_balance");
  }

  return fields;
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const docs = await db.document.findMany({ where: { userId: payload.sub } });
    // Properly DELETE files from disk using unlink
    for (const d of docs) {
      const fullPath = path.join(process.cwd(), d.filePath);
      try { await unlink(fullPath); } catch {}
    }
    await db.document.deleteMany({ where: { userId: payload.sub } });
    await db.auditLog.create({ data: { userId: payload.sub, action: "documents_all_deleted", details: JSON.stringify({ count: docs.length }) } });
    return NextResponse.json({ message: `Deleted ${docs.length} document(s).` });
  } catch { return NextResponse.json({ detail: "Failed to delete documents" }, { status: 500 }); }
}
