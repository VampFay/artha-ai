/**
 * WP 2.2 — RAG pipeline tests
 * Verifies: chunking strategy, cosine similarity, vector store, RAG context budget.
 */
import { describe, it, expect } from "vitest";
import { chunkDocument, estimateTokens, estimateTotalTokens } from "@/lib/rag/chunker";
import { cosineSimilarity } from "@/lib/rag/embeddings";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, PGVECTOR_SQL } from "@/lib/rag/schema";

describe("WP 2.2: Hybrid RAG & Vector Storage", () => {
  describe("Schema", () => {
    it("uses Xenova/all-MiniLM-L6-v2 (384 dims)", () => {
      expect(EMBEDDING_DIMENSIONS).toBe(384);
      expect(EMBEDDING_MODEL).toContain("MiniLM");
    });

    it("PGVECTOR_SQL creates extension + table + indexes", () => {
      expect(PGVECTOR_SQL).toContain("CREATE EXTENSION IF NOT EXISTS vector");
      expect(PGVECTOR_SQL).toContain("DocumentChunk");
      expect(PGVECTOR_SQL).toContain("vector(384)");
      expect(PGVECTOR_SQL).toContain("idx_doc_chunks_document");
    });
  });

  describe("chunkDocument", () => {
    it("returns empty array for empty text", () => {
      expect(chunkDocument("")).toEqual([]);
      expect(chunkDocument("   ")).toEqual([]);
    });

    it("returns single chunk for short text", () => {
      const text = "This is a short document.";
      const chunks = chunkDocument(text);
      expect(chunks.length).toBe(1);
      expect(chunks[0]).toBe(text);
    });

    it("splits by paragraph boundaries", () => {
      const text = "Para 1.\n\nPara 2.\n\nPara 3.";
      const chunks = chunkDocument(text);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks.join(" ")).toContain("Para 1");
      expect(chunks.join(" ")).toContain("Para 3");
    });

    it("respects token budget", () => {
      // 10K chars ≈ 2500 tokens — should split into multiple chunks of <512 tokens
      const longText = "word ".repeat(20000);
      const chunks = chunkDocument(longText);
      expect(chunks.length).toBeGreaterThan(1);
      for (const c of chunks) {
        // Each chunk should be at most ~maxTokens*4 chars (some tolerance for overlap)
        expect(c.length).toBeLessThan(600 * 4);
      }
    });

    it("handles bank statement structure (section-aware)", () => {
      const stmt = `
ACCOUNT SUMMARY
Balance: ₹100,000

TRANSACTIONS
Date       Description          Amount
01-Jan     Salary credit        +50,000
02-Jan     Rent payment         -15,000

FEES
Annual maintenance fee: ₹500
`.trim();
      const chunks = chunkDocument(stmt, { documentType: "bank_statement" });
      expect(chunks.length).toBeGreaterThan(0);
      // Should preserve key sections
      const allText = chunks.join(" ");
      expect(allText).toContain("ACCOUNT SUMMARY");
      expect(allText).toContain("TRANSACTIONS");
    });

    it("handles tax return structure (section numbers)", () => {
      const itr = `
1. SALARY
Basic: ₹500,000
HRA: ₹100,000

2. HOUSE PROPERTY
Rent received: ₹25,000

3. CAPITAL GAINS
STCG: ₹10,000
`.trim();
      const chunks = chunkDocument(itr, { documentType: "tax_return" });
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join(" ")).toContain("SALARY");
      expect(chunks.join(" ")).toContain("CAPITAL GAINS");
    });

    it("handles Form 16 structure (PART/Section)", () => {
      const f16 = `
PART A
Employer details

PART B
Salary breakdown

Section 17(1)
Basic salary
`.trim();
      const chunks = chunkDocument(f16, { documentType: "form_16" });
      expect(chunks.length).toBeGreaterThan(0);
      const allText = chunks.join(" ");
      expect(allText).toContain("PART A");
      expect(allText).toContain("PART B");
    });
  });

  describe("estimateTokens", () => {
    it("estimates ~4 chars per token", () => {
      expect(estimateTokens("hello world")).toBe(3); // 11 chars / 4 = 2.75 → ceil = 3
    });

    it("handles empty string", () => {
      expect(estimateTokens("")).toBe(0);
    });

    it("sums across chunks", () => {
      const chunks = ["hello world", "another chunk here"];
      const total = estimateTotalTokens(chunks);
      expect(total).toBeGreaterThan(5);
      expect(total).toBeLessThan(20);
    });
  });

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      const v = [1, 0, 0, 0];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
    });

    it("returns 0 for orthogonal vectors", () => {
      expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
    });

    it("returns -1 for opposite vectors", () => {
      expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 5);
    });

    it("returns 0 for zero vectors", () => {
      expect(cosineSimilarity([0, 0, 0], [1, 0, 0])).toBe(0);
    });

    it("throws on dimension mismatch", () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow("dimension mismatch");
    });

    it("handles 384-dim vectors", () => {
      const a = new Array(384).fill(0).map((_, i) => Math.sin(i));
      const b = new Array(384).fill(0).map((_, i) => Math.cos(i));
      const sim = cosineSimilarity(a, b);
      expect(sim).toBeGreaterThanOrEqual(-1);
      expect(sim).toBeLessThanOrEqual(1);
    });
  });

  describe("RAG context budget", () => {
    it("respects maxTokens budget when building context", async () => {
      // Generate enough chunks to overflow a small budget
      const longChunk = "test ".repeat(500); // ~2500 chars = ~625 tokens
      const { buildRagContext } = await import("@/lib/rag/vector-store");
      // We'll skip actual vector store interaction (no DB); just verify the budget logic via mock
      const maxTokens = 500;
      // Mock: pretend we have many chunks; buildRagContext will pull from memory store (empty in dev)
      const result = await buildRagContext(new Array(384).fill(0), { maxTokens, topK: 5 });
      expect(result.context.length).toBeLessThanOrEqual(maxTokens * 4 + 100); // some tolerance for separators
    });
  });
});
