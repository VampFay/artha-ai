import { describe, it, expect } from "vitest";
import {
  normalizeDate,
  normalizeAmount,
  detectBankFormat,
  categorizeTransaction,
  cleanDescription,
  extractMerchant,
} from "../bank-statement";

describe("Bank Statement Parser", () => {
  describe("normalizeDate", () => {
    it("parses DD/MM/YYYY", () => {
      const d = normalizeDate("05/01/2024");
      expect(d).not.toBeNull();
      expect(d!.getDate()).toBe(5);
      expect(d!.getMonth()).toBe(0); // January
      expect(d!.getFullYear()).toBe(2024);
    });

    it("parses DD-MM-YYYY", () => {
      const d = normalizeDate("10-03-2024");
      expect(d).not.toBeNull();
      expect(d!.getDate()).toBe(10);
      expect(d!.getMonth()).toBe(2); // March
    });

    it("parses DD/MM/YY", () => {
      const d = normalizeDate("05/01/24");
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
    });

    it("parses DD-MMM-YYYY", () => {
      const d = normalizeDate("05-Jan-2024");
      expect(d).not.toBeNull();
      expect(d!.getMonth()).toBe(0);
    });

    it("parses ISO YYYY-MM-DD", () => {
      const d = normalizeDate("2024-01-05");
      expect(d).not.toBeNull();
      expect(d!.getDate()).toBe(5);
    });

    it("parses Excel serial number", () => {
      // Excel serial 45292 = Jan 1, 2024
      const d = normalizeDate("45292");
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
      expect(d!.getMonth()).toBe(0);
    });

    it("returns null for invalid date", () => {
      expect(normalizeDate("invalid")).toBeNull();
      expect(normalizeDate("")).toBeNull();
      expect(normalizeDate(null as any)).toBeNull();
    });
  });

  describe("normalizeAmount", () => {
    it("parses simple number", () => {
      expect(normalizeAmount("1234.56")).toBe(1234.56);
    });

    it("strips currency symbols and commas", () => {
      expect(normalizeAmount("₹1,23,456")).toBe(123456);
      expect(normalizeAmount("$1,234.56")).toBe(1234.56);
    });

    it("handles DR suffix as negative", () => {
      expect(normalizeAmount("1234 DR")).toBe(-1234);
    });

    it("handles CR suffix as positive", () => {
      expect(normalizeAmount("1234 CR")).toBe(1234);
    });

    it("handles parentheses as negative", () => {
      expect(normalizeAmount("(1234.56)")).toBe(-1234.56);
    });

    it("handles empty/null", () => {
      expect(normalizeAmount("")).toBe(0);
      expect(normalizeAmount(null as any)).toBe(0);
    });

    it("handles numbers", () => {
      expect(normalizeAmount(1234)).toBe(1234);
      expect(normalizeAmount(0)).toBe(0);
    });
  });

  describe("detectBankFormat", () => {
    it("detects HDFC", () => {
      expect(detectBankFormat(["Date", "Narration", "Withdrawal", "Deposit", "Closing Balance"])).toBe("hdfc");
    });

    it("detects ICICI", () => {
      expect(detectBankFormat(["Transaction Date", "Description", "Debit", "Credit", "Balance"])).toBe("icici");
    });

    it("detects SBI", () => {
      expect(detectBankFormat(["Txn Date", "Description", "Debit", "Credit", "Balance"])).toBe("sbi");
    });

    it("returns unknown for unrecognized headers", () => {
      expect(detectBankFormat(["foo", "bar", "baz"])).toBe("unknown");
    });
  });

  describe("categorizeTransaction", () => {
    it("categorizes Swiggy as Food", () => {
      expect(categorizeTransaction("UPI/SWIGGY BANGALORE")).toBe("Food");
    });

    it("categorizes Amazon as Shopping", () => {
      expect(categorizeTransaction("UPI/AMAZON IN")).toBe("Shopping");
    });

    it("categorizes rent", () => {
      expect(categorizeTransaction("RENT TRANSFER TO OWNER")).toBe("Rent");
    });

    it("categorizes Netflix as Entertainment", () => {
      expect(categorizeTransaction("NETFLIX SUBSCRIPTION")).toBe("Entertainment");
    });

    it("categorizes Airtel as Bills", () => {
      expect(categorizeTransaction("AIRTEL POSTPAID BILL")).toBe("Bills");
    });

    it("returns Other for unrecognized", () => {
      expect(categorizeTransaction("SOME RANDOM TRANSACTION")).toBe("Other");
    });
  });

  describe("cleanDescription", () => {
    it("removes UPI refs", () => {
      const cleaned = cleanDescription("UPI/3123/SWIGGY @oksbi");
      expect(cleaned).not.toContain("@oksbi");
    });

    it("removes Ref No", () => {
      const cleaned = cleanDescription("PAID Ref No 123456");
      expect(cleaned).not.toContain("Ref No");
    });

    it("collapses multiple spaces", () => {
      const cleaned = cleanDescription("hello    world");
      expect(cleaned).toBe("hello world");
    });
  });

  describe("extractMerchant", () => {
    it("extracts merchant from UPI pattern", () => {
      const m = extractMerchant("Paid to SWIGGY on 2024-01-05");
      expect(m).toBe("SWIGGY");
    });

    it("extracts first 3 words as fallback", () => {
      const m = extractMerchant("BIGBASKET BANGALORE ORDER");
      expect(m).toBe("BIGBASKET BANGALORE ORDER");
    });
  });
});
