import { describe, it, expect } from "vitest";

// Test formatting utilities
function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

describe("Format Utilities", () => {
  describe("formatINR", () => {
    it("formats 0 correctly", () => {
      const result = formatINR(0);
      expect(result).toContain("0");
    });

    it("formats lakhs correctly", () => {
      const result = formatINR(1500000);
      expect(result).toContain("15");
      expect(result).toContain("00");
    });

    it("formats crores correctly", () => {
      const result = formatINR(14200000);
      expect(result).toContain("1");
      expect(result).toContain("42");
    });

    it("rounds to nearest rupee", () => {
      const result = formatINR(1234.56);
      expect(result).not.toContain("1234.56");
    });
  });

  describe("formatPercent", () => {
    it("formats whole number", () => {
      expect(formatPercent(28)).toBe("28.0%");
    });

    it("formats decimal", () => {
      expect(formatPercent(22.56)).toBe("22.6%");
    });

    it("formats zero", () => {
      expect(formatPercent(0)).toBe("0.0%");
    });

    it("formats negative", () => {
      expect(formatPercent(-5.2)).toBe("-5.2%");
    });
  });

  describe("formatBytes", () => {
    it("formats bytes", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("formats kilobytes", () => {
      expect(formatBytes(1500)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
      expect(formatBytes(1500000)).toBe("1.4 MB");
    });

    it("formats 0 bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });
  });
});
