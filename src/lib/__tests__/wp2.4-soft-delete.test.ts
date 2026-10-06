/**
 * WP 2.4 — Soft-delete extension tests
 *
 * Tests the soft-delete behavior using the Prisma Client Extensions API.
 * Uses a mock Prisma client to verify query interception + transformation.
 */
import { describe, it, expect, vi } from "vitest";
import { withSoftDelete, isSoftDeleteModel } from "@/lib/db-soft-delete";

// Mock Prisma client — capture query args and return predictable responses
function createMockClient() {
  const calls: { action: string; model: string; args: any }[] = [];

  const queryHandlers = {
    findUnique: vi.fn(async (args: any) => {
      calls.push({ action: "findUnique", model: "Document", args });
      return { id: args.where?.id, found: true };
    }),
    findFirst: vi.fn(async (args: any) => {
      calls.push({ action: "findFirst", model: "Document", args });
      return { id: args.where?.id, found: true };
    }),
    findMany: vi.fn(async (args: any) => {
      calls.push({ action: "findMany", model: "Document", args });
      return [{ id: "1" }, { id: "2" }];
    }),
    count: vi.fn(async (args: any) => {
      calls.push({ action: "count", model: "Document", args });
      return 5;
    }),
    update: vi.fn(async (args: any) => {
      calls.push({ action: "update", model: "Document", args });
      return { id: args.where?.id, updated: true };
    }),
    updateMany: vi.fn(async (args: any) => {
      calls.push({ action: "updateMany", model: "Document", args });
      return { count: 3 };
    }),
    delete: vi.fn(async (args: any) => {
      calls.push({ action: "delete", model: "Document", args });
      return { id: args.where?.id, deleted: true };
    }),
    deleteMany: vi.fn(async (args: any) => {
      calls.push({ action: "deleteMany", model: "Document", args });
      return { count: 5 };
    }),
  };

  // Each model delegates to the same handlers (we don't need to differentiate)
  const client = {
    $extends: vi.fn((extension: any) => {
      // Simulate the $extends behavior: wrap query handlers
      const wrappedQueryHandlers: Record<string, any> = {};
      for (const [model, handlers] of Object.entries(extension.query || {})) {
        wrappedQueryHandlers[model] = {};
        for (const [op, handler] of Object.entries(handlers as any)) {
          wrappedQueryHandlers[model][op] = (args: any) =>
            (handler as any)({
              args,
              query: (a: any) => queryHandlers[op as keyof typeof queryHandlers](a),
              model,
              operation: op,
            });
        }
      }
      // Return a new "extended" client with the wrapped handlers
      const extended = {} as any;
      for (const model of Object.keys(extension.query || {})) {
        extended[model] = wrappedQueryHandlers[model];
      }
      // Preserve non-model methods
      extended._baseClient = client;
      return extended;
    }),
    Document: queryHandlers,
    Income: queryHandlers,
    Goal: queryHandlers,
    Expense: queryHandlers,
    AuditLog: queryHandlers,
  };

  return { client, calls, queryHandlers };
}

describe("WP 2.4: Financial Compliance Soft-Delete System", () => {
  describe("isSoftDeleteModel", () => {
    it("recognizes financial models as soft-delete", () => {
      expect(isSoftDeleteModel("Document")).toBe(true);
      expect(isSoftDeleteModel("Income")).toBe(true);
      expect(isSoftDeleteModel("Expense")).toBe(true);
      expect(isSoftDeleteModel("Goal")).toBe(true);
      expect(isSoftDeleteModel("Liability")).toBe(true);
      expect(isSoftDeleteModel("AssetHolding")).toBe(true);
      expect(isSoftDeleteModel("Entity")).toBe(true);
    });

    it("does NOT mark AuditLog as soft-delete", () => {
      expect(isSoftDeleteModel("AuditLog")).toBe(false);
    });

    it("does NOT mark User as soft-delete", () => {
      expect(isSoftDeleteModel("User")).toBe(false);
    });
  });

  describe("Extension behavior", () => {
    it("injects deletedAt: null on findMany by default", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.findMany({ where: { userId: "u1" } });
      const call = calls.find((c) => c.action === "findMany");
      expect(call?.args.where.deletedAt).toBe(null);
      expect(call?.args.where.userId).toBe("u1");
    });

    it("respects includeDeleted opt-in", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.findMany({ where: {}, includeDeleted: true });
      const call = calls.find((c) => c.action === "findMany");
      expect(call?.args.where.deletedAt).toBeUndefined();
      expect(call?.args.includeDeleted).toBeUndefined();
    });

    it("preserves user's explicit deletedAt where clause", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.findMany({ where: { deletedAt: { not: null } } });
      const call = calls.find((c) => c.action === "findMany");
      expect(call?.args.where.deletedAt).toEqual({ not: null });
    });

    it("converts delete → update with deletedAt=now", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.delete({ where: { id: "doc1" } });
      // delete is intercepted and re-routed to update
      const call = calls.find((c) => c.action === "update");
      expect(call).toBeDefined();
      expect(call?.args.data.deletedAt).toBeInstanceOf(Date);
      expect(call?.args.where.id).toBe("doc1");
    });

    it("converts deleteMany → updateMany", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.deleteMany({ where: { userId: "u1" } });
      const call = calls.find((c) => c.action === "updateMany");
      expect(call).toBeDefined();
      expect(call?.args.data.deletedAt).toBeInstanceOf(Date);
      expect(call?.args.where.userId).toBe("u1");
    });

    it("injects deletedAt: null on update (won't touch deleted)", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.update({
        where: { id: "doc1" },
        data: { fileName: "renamed.pdf" },
      });
      const call = calls.find((c) => c.action === "update");
      expect(call?.args.where.deletedAt).toBe(null);
      expect(call?.args.data.fileName).toBe("renamed.pdf");
    });

    it("injects deletedAt: null on findUnique", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.findUnique({ where: { id: "doc1" } });
      const call = calls.find((c) => c.action === "findUnique");
      expect(call?.args.where.deletedAt).toBe(null);
    });

    it("injects deletedAt: null on count", async () => {
      const { client, calls } = createMockClient();
      const extended: any = withSoftDelete(client as any);
      await extended.Document.count({ where: { userId: "u1" } });
      const call = calls.find((c) => c.action === "count");
      expect(call?.args.where.deletedAt).toBe(null);
    });
  });

  describe("Coverage and edge cases", () => {
    it("source code lists all financial models", () => {
      const fs = require("fs");
      const src = fs.readFileSync("/home/z/my-project/src/lib/db-soft-delete.ts", "utf-8");
      expect(src).toContain('"Document"');
      expect(src).toContain('"Income"');
      expect(src).toContain('"Expense"');
      expect(src).toContain('"Goal"');
      expect(src).toContain('"Liability"');
      expect(src).toContain('"AssetHolding"');
      expect(src).toContain('"Entity"');
      expect(src).toContain('"EntityTransaction"');
      expect(src).toContain('"EntityTaxProfile"');
    });

    it("includes restore + hardDelete helpers for GDPR", () => {
      const fs = require("fs");
      const src = fs.readFileSync("/home/z/my-project/src/lib/db-soft-delete.ts", "utf-8");
      expect(src).toContain("restoreSoftDeleted");
      expect(src).toContain("hardDelete");
      expect(src).toContain("listDeleted");
    });
  });
});
