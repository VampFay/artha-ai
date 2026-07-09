/**
 * Bank Statement Parser
 * Supports HDFC, ICICI, SBI, Axis, Kotak bank CSV/XLSX exports.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

export type BankFormat = "hdfc" | "icici" | "sbi" | "axis" | "kotak" | "unknown";

export interface Transaction {
  date: Date;
  description: string;
  amount: number;
  type: "debit" | "credit";
  balance?: number;
  category?: string;
  merchant?: string | null;
}

export interface BankStatementResult {
  transactions: Transaction[];
  totals: { credits: number; debits: number; net: number };
  sourceFormat: BankFormat;
  monthDetected?: string;
  transactionCount: number;
}

export function detectBankFormat(headers: string[]): BankFormat {
  const h = headers.map(x => String(x).toLowerCase().trim());
  const has = (keys: string[]) => keys.every(k => h.some(x => x.includes(k)));
  if (has(["narration"]) && (has(["withdrawal"]) || has(["deposit"]))) return "hdfc";
  if (has(["transaction date"]) && has(["debit"]) && has(["credit"])) return "icici";
  if (has(["txn date"]) && has(["description"]) && has(["balance"])) return "sbi";
  if (has(["date"]) && has(["narration"]) && has(["withdrawal amt"])) return "axis";
  if (has(["date"]) && has(["narration"]) && has(["withdrawal"])) return "kotak";
  return "unknown";
}

export function normalizeDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (/^\d{4,5}$/.test(s) && Number(s) > 30000) {
    const days = Number(s);
    const date = new Date(Date.UTC(1899, 11, 30) + days * 86400000);
    return isNaN(date.getTime()) ? null : date;
  }
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) { const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); return isNaN(d.getTime()) ? null : d; }
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) { const yy = 2000 + Number(m[3]); const d = new Date(yy, Number(m[2]) - 1, Number(m[1])); return isNaN(d.getTime()) ? null : d; }
  m = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{4})$/i);
  if (m) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const mi = months.indexOf(m[2].toLowerCase());
    if (mi === -1) return null;
    const d = new Date(Number(m[3]), mi, Number(m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) { const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); return isNaN(d.getTime()) ? null : d; }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeAmount(value: any): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  let s = String(value).trim();
  let isNegative = false;
  if (/^\(.*\)$/.test(s)) { isNegative = true; s = s.slice(1, -1); }
  if (/dr$/i.test(s)) { isNegative = true; s = s.replace(/dr$/i, ""); }
  if (/cr$/i.test(s)) { s = s.replace(/cr$/i, ""); }
  s = s.replace(/[₹$,\s]/g, "");
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return isNegative ? -Math.abs(n) : n;
}

export function cleanDescription(desc: string): string {
  let s = String(desc || "").trim();
  s = s.replace(/\s+@ok\w+/g, "");
  s = s.replace(/\s+Ref\s*No\s*\d+.*$/i, "");
  s = s.replace(/\s+\d{2}[\/\-]\d{2}[\/\-]\d{2,4}\s*$/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

export function extractMerchant(desc: string): string | null {
  const s = cleanDescription(desc);
  let m = s.match(/(?:paid to|to|sent to)\s+(.+?)\s+on/i);
  if (m) return m[1].trim();
  const words = s.split(/\s+/).filter(Boolean).slice(0, 3);
  if (words.length > 0) return words.join(" ");
  return null;
}

const MERCHANT_MAP: Record<string, string> = {
  swiggy: "Food", zomato: "Food", dominos: "Food", mcdonald: "Food", kfc: "Food",
  "pizza hut": "Food", "freshmenu": "Food", behrouz: "Food",
  bigbasket: "Groceries", grofers: "Groceries", blinkit: "Groceries", zepto: "Groceries",
  dmart: "Groceries", "reliance fresh": "Groceries", "more supermarket": "Groceries",
  amazon: "Shopping", flipkart: "Shopping", myntra: "Shopping", ajio: "Shopping",
  snapdeal: "Shopping", meesho: "Shopping", nykaa: "Shopping",
  uber: "Transport", ola: "Transport", rapido: "Transport", irctc: "Transport",
  redbus: "Transport", makemytrip: "Transport", indigo: "Transport",
  netflix: "Entertainment", hotstar: "Entertainment", primevideo: "Entertainment",
  spotify: "Entertainment", bookmyshow: "Entertainment", "sony liv": "Entertainment",
  airtel: "Bills", jio: "Bills", vodafone: "Bills", bsnl: "Bills",
  "tata power": "Bills", "adani electricity": "Bills", mseb: "Bills",
  mahadiscom: "Bills", "indane gas": "Bills", "bharat gas": "Bills", "hp gas": "Bills",
  rent: "Rent", rental: "Rent",
  zerodha: "Investments", groww: "Investments", upstox: "Investments",
  "mutual fund": "Investments", sip: "Investments", nps: "Investments", ppf: "Investments",
  pharmeasy: "Health", "1mg": "Health", "apollo pharmacy": "Health",
  practo: "Health", "cult fit": "Health", curefit: "Health",
  emi: "EMI", loan: "EMI", "bajaj finance": "EMI", "hdfc loan": "EMI",
};

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/rent|rental/i, "Rent"],
  [/salary|payroll|credited by employer/i, "Salary"],
  [/swiggy|zomato|dominos|pizza|kfc|mcdonald|restaurant|dining|food/i, "Food"],
  [/bigbasket|grofers|blinkit|zepto|dmart|grocery|supermarket|vegetables/i, "Groceries"],
  [/amazon|flipkart|myntra|ajio|shopping|purchase|order/i, "Shopping"],
  [/uber|ola|rapido|irctc|train|flight|fuel|petrol|diesel|bus|cab/i, "Transport"],
  [/netflix|hotstar|spotify|primevideo|bookmyshow|movie|entertainment/i, "Entertainment"],
  [/airtel|jio|vodafone|bsnl|electricity|power|gas|water|broadband|bill|recharge/i, "Bills"],
  [/zerodha|groww|upstox|mutual|sip|nps|ppf|invest|equity|stock/i, "Investments"],
  [/emi|loan|bajaj finance|hdfc loan|icici loan|interest charged/i, "EMI"],
  [/pharmeasy|1mg|apollo|pharmacy|hospital|doctor|medical|health/i, "Health"],
  [/gym|fitness|cult|curefit/i, "Health"],
  [/atm|cash withdrawal|wdl/i, "Cash"],
  [/insurance|premium|lic/i, "Insurance"],
  [/tax|gst|tds/i, "Tax"],
  [/donation|charity/i, "Donation"],
  [/education|fee|tuition|course|udemy|coursera/i, "Education"],
];

export function categorizeTransaction(desc: string): string {
  const s = desc.toLowerCase();
  for (const [merchant, cat] of Object.entries(MERCHANT_MAP)) {
    if (s.includes(merchant)) return cat;
  }
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(desc)) return cat;
  }
  return "Other";
}

interface ParseConfig {
  dateCol: string[]; descCol: string[]; debitCol: string[]; creditCol: string[]; balanceCol: string[];
}

const PARSE_CONFIGS: Record<BankFormat, ParseConfig> = {
  hdfc: { dateCol: ["date"], descCol: ["narration"], debitCol: ["withdrawal", "withdrawal amt"], creditCol: ["deposit", "credit"], balanceCol: ["closing balance", "balance"] },
  icici: { dateCol: ["transaction date"], descCol: ["description"], debitCol: ["debit"], creditCol: ["credit"], balanceCol: ["balance"] },
  sbi: { dateCol: ["txn date"], descCol: ["description"], debitCol: ["debit"], creditCol: ["credit"], balanceCol: ["balance"] },
  axis: { dateCol: ["date"], descCol: ["narration"], debitCol: ["withdrawal amt"], creditCol: ["deposit amt"], balanceCol: ["balance"] },
  kotak: { dateCol: ["date"], descCol: ["narration"], debitCol: ["withdrawal"], creditCol: ["deposit"], balanceCol: ["balance"] },
  unknown: { dateCol: ["date", "txn date"], descCol: ["description", "narration", "details"], debitCol: ["debit", "withdrawal", "withdrawal amt", "dr"], creditCol: ["credit", "deposit", "deposit amt", "cr"], balanceCol: ["balance", "closing balance"] },
};

function findCol(headers: string[], candidates: string[]): string | null {
  const lowerHeaders = headers.map(h => String(h).toLowerCase().trim());
  for (const c of candidates) {
    const idx = lowerHeaders.findIndex(h => h.includes(c));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

function parseRow(row: Record<string, any>, headers: string[], config: ParseConfig): Transaction | null {
  const dateKey = findCol(headers, config.dateCol);
  const descKey = findCol(headers, config.descCol);
  const debitKey = findCol(headers, config.debitCol);
  const creditKey = findCol(headers, config.creditCol);
  const balanceKey = findCol(headers, config.balanceCol);
  if (!dateKey || !descKey) return null;
  const date = normalizeDate(row[dateKey]);
  if (!date) return null;
  const rawDesc = String(row[descKey] || "");
  const description = cleanDescription(rawDesc);
  if (!description) return null;
  const debit = debitKey ? Math.abs(normalizeAmount(row[debitKey])) : 0;
  const credit = creditKey ? Math.abs(normalizeAmount(row[creditKey])) : 0;
  let amount: number; let type: "debit" | "credit";
  if (credit > 0 && debit === 0) { amount = credit; type = "credit"; }
  else if (debit > 0 && credit === 0) { amount = debit; type = "debit"; }
  else if (debit > 0 && credit > 0) { amount = debit; type = "debit"; }
  else return null;
  const balance = balanceKey ? normalizeAmount(row[balanceKey]) : undefined;
  const category = categorizeTransaction(description);
  const merchant = extractMerchant(description);
  return { date, description, amount, type, balance, category, merchant };
}

export function parseTransactions(rows: Record<string, any>[], headers: string[]): Transaction[] {
  const format = detectBankFormat(headers);
  const config = PARSE_CONFIGS[format] || PARSE_CONFIGS.unknown;
  const txns: Transaction[] = [];
  for (const row of rows) {
    try { const t = parseRow(row, headers, config); if (t) txns.push(t); } catch {}
  }
  txns.sort((a, b) => a.date.getTime() - b.date.getTime());
  return txns;
}

export function summarizeTransactions(txns: Transaction[], format: BankFormat): BankStatementResult {
  const credits = txns.filter(t => t.type === "credit").reduce((a, t) => a + t.amount, 0);
  const debits = txns.filter(t => t.type === "debit").reduce((a, t) => a + t.amount, 0);
  let monthDetected: string | undefined;
  if (txns.length > 0) {
    const d = txns[0].date;
    monthDetected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return {
    transactions: txns,
    totals: { credits, debits, net: credits - debits },
    sourceFormat: format,
    monthDetected,
    transactionCount: txns.length,
  };
}

// ============= CSV/XLSX ENTRY POINT =============

export function parseBankStatement(buffer: Buffer, fileName: string): BankStatementResult {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  let rows: Record<string, any>[] = [];
  let headers: string[] = [];

  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    // Parse as raw rows first (no header) to detect metadata preamble
    const rawParsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const rawRows = rawParsed.data as string[][];

    // Scan first 15 rows for a header row that matches a known bank format
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
      const candidateHeaders = rawRows[i].map(h => String(h || "").trim());
      const fmt = detectBankFormat(candidateHeaders);
      if (fmt !== "unknown") {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex >= 0) {
      // Re-parse with the detected header row
      const dataRows = rawRows.slice(headerRowIndex + 1);
      headers = rawRows[headerRowIndex].map(h => String(h || "").trim());
      rows = dataRows
        .filter(r => r.some(c => String(c || "").trim() !== ""))
        .map(r => {
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => { obj[h] = r[i]; });
          return obj;
        });
    } else {
      // Fallback: standard header parse
      const parsed = Papa.parse(text, { header: true, dynamicTyping: false, skipEmptyLines: true });
      rows = ((parsed.data as unknown[]) || []).filter((r: any) => Object.keys(r).length > 1) as Record<string, any>[];
      headers = parsed.meta?.fields || (rows[0] ? Object.keys(rows[0]) : []);
    }
  } else if (ext === "xlsx") {
    const wb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { raw: true, defval: "" });
    rows = json;
    headers = rows[0] ? Object.keys(rows[0]) : [];
  }

  const format = detectBankFormat(headers);
  const txns = parseTransactions(rows, headers);
  const summary = summarizeTransactions(txns, format);
  return summary;
}
