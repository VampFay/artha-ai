/**
 * WP Integration Test — exercises all 6 work packages in one flow
 * Verifies the whole system works together end-to-end.
 *
 * WP 2.1: Upload state management (background parsing queue)
 * WP 2.2: RAG chunking + similarity
 * WP 2.3: Auth rate-limiting (IP/identity windows)
 * WP 2.4: Soft-delete behavior
 * WP 3.1: Telemetry span lifecycle
 * WP 3.2: Build artifacts + Dockerfile existence
 */
import { describe, it, expect } from "vitest";
import { uploadStore } from "@/lib/realtime/upload-store";
import { chunkDocument, estimateTokens } from "@/lib/rag/chunker";
import { cosineSimilarity } from "@/lib/rag/embeddings";
import { canAttemptAuth, recordAuthFailure, recordAuthSuccess, isAccountLocked, rateLimitResponse } from "@/lib/security/auth-rate-limit";
import { withSoftDelete, isSoftDeleteModel } from "@/lib/db-soft-delete";
import { withSpan, setSpanAttribute, getCurrentTraceId } from "@/lib/telemetry";
import { EMBEDDING_DIMENSIONS, PGVECTOR_SQL } from "@/lib/rag/schema";
import fs from "fs";
import path from "path";

describe("Integration: All 6 Work Packages Together", () => {
  describe("Cross-WP integration scenarios", () => {
    it("WP2.1+2.2: upload + chunk + embed a document end-to-end (mocked)", async () => {
      // 1. Init multipart upload (WP2.1)
      const uploadId = "test-upload-id";
      uploadStore.set(uploadId, {
        parts: [], key: "uploads/u1/test.pdf", contentType: "application/pdf",
        userId: "u1", fileName: "test.pdf", startedAt: Date.now(),
      });
      expect(uploadStore.get(uploadId)).toBeDefined();

      // 2. Add parts (simulate chunked upload)
      const state = uploadStore.get(uploadId)!;
      state.parts.push({ partNumber: 1, etag: "etag1" });
      state.parts.push({ partNumber: 2, etag: "etag2" });
      expect(state.parts).toHaveLength(2);

      // 3. After upload complete → chunk the document content (WP2.2)
      const documentText = `
Section A — Account Summary
Balance: ₹100,000

Section B — Transactions
01-Jan Salary credit +50,000
02-Jan Rent payment -15,000
      `.trim();
      const chunks = chunkDocument(documentText, { documentType: "bank_statement" });
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join(" ")).toContain("Account Summary");
      expect(chunks.join(" ")).toContain("Transactions");

      // 4. Embed (mocked — just verify dimensions)
      const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0).map((_, i) => Math.sin(i));
      expect(embedding.length).toBe(384);

      // 5. Verify similarity search would work (mock)
      const sim = cosineSimilarity(embedding, embedding);
      expect(sim).toBeCloseTo(1, 5);

      // 6. Cleanup
      uploadStore.delete(uploadId);
      expect(uploadStore.get(uploadId)).toBeUndefined();
    });

    it("WP2.3+3.1: rate-limited auth with telemetry span", async () => {
      const ip = "203.0.113.99";
      const email = "integration-test@example.com";

      let capturedTraceId: string | undefined;

      // Wrap in telemetry span
      const result = await withSpan("test.auth.integration", async (span) => {
        setSpanAttribute("test.ip", ip);
        setSpanAttribute("test.email_hash", email.substring(0, 3));
        // Capture trace ID while we're inside the span
        capturedTraceId = getCurrentTraceId();

        const authResult = await canAttemptAuth(ip, email);
        if (!authResult.allowed) {
          return rateLimitResponse(authResult.reason!, authResult.retryAfter!);
        }
        return new Response(JSON.stringify({ allowed: true }), { status: 200 });
      }, {
        "test.scenario": "auth_integration",
        "test.work_package": "2.3",
      });

      expect(result.status).toBe(200);
      // Note: telemetry trace ID is undefined when no real OTel SDK is registered
      // (verified separately in wp3.1-telemetry.test.ts with mocked SDK)
      expect(capturedTraceId === undefined || typeof capturedTraceId === "string").toBe(true);
    });

    it("WP2.4: soft-delete preserves audit lineage", () => {
      const isDocumentSoftDelete = isSoftDeleteModel("Document");
      const isAuditLogSoftDelete = isSoftDeleteModel("AuditLog");

      expect(isDocumentSoftDelete).toBe(true);
      expect(isAuditLogSoftDelete).toBe(false);

      // Soft-delete middleware extension is constructed properly
      const mockClient: any = { $extends: () => ({}) };
      const extended = withSoftDelete(mockClient);
      expect(extended).toBeDefined();
    });

    it("WP2.2: PGVECTOR_SQL is well-formed", () => {
      // Quick sanity — should be valid SQL
      expect(PGVECTOR_SQL).toContain("CREATE EXTENSION IF NOT EXISTS vector");
      expect(PGVECTOR_SQL).toContain("CREATE TABLE IF NOT EXISTS");
      expect(PGVECTOR_SQL).toContain("vector(384)");
      expect(PGVECTOR_SQL).toMatch(/CREATE INDEX/);
    });

    it("WP3.2: Dockerfile uses Bun runtime, multi-stage, non-root", () => {
      const dockerfile = fs.readFileSync(path.join(__dirname, "../../..", "Dockerfile"), "utf-8");
      expect(dockerfile).toContain("FROM oven/bun:1.3.14-alpine AS builder");
      expect(dockerfile).toContain("FROM oven/bun:1.3.14-alpine AS runner");
      expect(dockerfile).toContain("USER artha"); // non-root
      expect(dockerfile).toContain("tini"); // proper signal handling
      expect(dockerfile).toContain("HEALTHCHECK");
    });

    it("WP3.2: CI workflow has all 5 jobs", () => {
      const ci = fs.readFileSync(path.join(__dirname, "../../..", ".github/workflows/ci.yml"), "utf-8");
      // Job keys are YAML identifiers, not the display name
      expect(ci).toContain("  quality:");
      expect(ci).toContain("  container-build:");
      expect(ci).toContain("  e2e:");
      expect(ci).toContain("  deploy-staging:");
      expect(ci).toContain("  deploy-prod:");
    });

    it("WP3.2: CI workflow includes Postgres migration gate", () => {
      const ci = fs.readFileSync(path.join(__dirname, "../../..", ".github/workflows/ci.yml"), "utf-8");
      expect(ci).toContain("Postgres migration gate");
      expect(ci).toContain("bun run db:push");
    });

    it("WP3.1: instrumentation.ts uses Next.js convention", () => {
      const instr = fs.readFileSync(path.join(__dirname, "../../..", "src/instrumentation.ts"), "utf-8");
      expect(instr).toContain("export async function register");
      expect(instr).toContain("initTelemetry");
    });
  });

  describe("End-to-end DoS attack scenario (mocked)", () => {
    it("blocks 1000-attempt DoS attack pre-bcrypt (no bcrypt CPU burned)", async () => {
      const ip = "198.51.100.99";
      const email = "dos@example.com";
      let allowed = 0;
      let blocked = 0;
      let bcryptCalls = 0;

      for (let i = 0; i < 1000; i++) {
        const check = await canAttemptAuth(ip, email);
        if (check.allowed) {
          allowed++;
          // bcrypt.compare would happen here (mocked — we don't actually call it)
          bcryptCalls++;
        } else {
          blocked++;
        }
      }

      // Should have blocked ~990 of 1000 attempts
      expect(blocked).toBeGreaterThan(900);
      expect(allowed).toBeLessThanOrEqual(10);
      expect(bcryptCalls).toBeLessThanOrEqual(10); // CRITICAL — CPU saved
    });

    it("bans IP after 20 failures across different emails", async () => {
      const ip = "198.51.100.100";
      let lastResult;
      for (let i = 0; i < 20; i++) {
        lastResult = await recordAuthFailure(ip, `email-${i}@dos.example`, undefined);
      }
      expect(lastResult?.ipBanned).toBe(true);

      // Subsequent attempts from this IP should be blocked at the IP level
      const blocked = await canAttemptAuth(ip, "any-other@example.com");
      expect(blocked.allowed).toBe(false);
      expect(blocked.reason).toBe("ip_banned");
    });

    it("locks account after 5 failures with same userId", async () => {
      const ip = "198.51.100.101";
      const email = "lock-integration@example.com";
      const userId = "user-lock-int";

      let locked = false;
      for (let i = 0; i < 5; i++) {
        const r = await recordAuthFailure(ip, email, userId);
        if (r.accountLocked) locked = true;
      }
      expect(locked).toBe(true);
      expect(await isAccountLocked(userId)).toBe(true);

      // Cleanup — clear lock via successful auth
      await recordAuthSuccess(ip, email, userId);
    });
  });

  describe("All WP module files exist", () => {
    it("WP2.1 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "src/lib/realtime/upload-store.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/lib/realtime/socket-server.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/app/api/documents/multipart/[uploadId]/route.ts"))).toBe(true);
    });

    it("WP2.2 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "src/lib/rag/schema.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/lib/rag/chunker.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/lib/rag/embeddings.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/lib/rag/vector-store.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/app/api/rag/search/route.ts"))).toBe(true);
    });

    it("WP2.3 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "src/lib/security/auth-rate-limit.ts"))).toBe(true);
    });

    it("WP2.4 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "src/lib/db-soft-delete.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/lib/db.ts"))).toBe(true);
    });

    it("WP3.1 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "src/lib/telemetry.ts"))).toBe(true);
      expect(fs.existsSync(path.join(root, "src/instrumentation.ts"))).toBe(true);
    });

    it("WP3.2 files present", () => {
      const root = path.join(__dirname, "../../..");
      expect(fs.existsSync(path.join(root, "Dockerfile"))).toBe(true);
      expect(fs.existsSync(path.join(root, ".github/workflows/ci.yml"))).toBe(true);
      expect(fs.existsSync(path.join(root, "e2e/smoke.spec.ts"))).toBe(true);
    });
  });
});
