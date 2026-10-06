/**
 * Prisma Soft-Delete Extension
 * -----------------------------
 * WP2.4 — Convert DELETE operations into soft-deletes for financial models.
 *
 * Uses Prisma Client Extensions API (the modern replacement for $use middleware,
 * which was deprecated in Prisma 6+).
 *
 * Behavior:
 *   - DELETE on soft-delete models → UPDATE set deletedAt = now()
 *   - findUnique/findMany/findFirst → auto-filter out deleted records
 *     (unless explicitly opts in with `includeDeleted: true`)
 *   - deleteMany → updateMany set deletedAt
 */
import { Prisma, PrismaClient } from "@prisma/client";

const SOFT_DELETE_MODELS = [
  "Document",
  "DocumentChunk",
  "Income",
  "Expense",
  "Goal",
  "Liability",
  "AssetHolding",
  "Entity",
  "EntityTransaction",
  "EntityTaxProfile",
  "Subscription",
  "Nominee",
] as const;

type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number];

// Build a string-literal union type for model names
type ModelName = (typeof SOFT_DELETE_MODELS)[number];

/**
 * Apply the soft-delete extension to a Prisma client.
 *
 * Usage:
 *   import { PrismaClient } from "@prisma/client";
 *   import { withSoftDelete } from "@/lib/db-soft-delete";
 *   const prisma = withSoftDelete(new PrismaClient());
 */
export function withSoftDelete<T extends PrismaClient>(client: T): T {
  return (client as any).$extends({
    name: "soft-delete",
    query: {
      // For each soft-delete model, override find/delete operations
      ...Object.fromEntries(
        SOFT_DELETE_MODELS.map((model) => [
          model,
          {
            // findUnique → inject where.deletedAt = null unless includeDeleted or explicitly set
            async findUnique({ args, query }: { args: any; query: any }) {
              if (args.includeDeleted) {
                delete args.includeDeleted;
              } else if (args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            async findFirst({ args, query }: { args: any; query: any }) {
              if (args.includeDeleted) {
                delete args.includeDeleted;
              } else if (args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            async findMany({ args, query }: { args: any; query: any }) {
              if (args.includeDeleted) {
                delete args.includeDeleted;
              } else if (args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            async count({ args, query }: { args: any; query: any }) {
              if (args.includeDeleted) {
                delete args.includeDeleted;
              } else if (args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            async aggregate({ args, query }: { args: any; query: any }) {
              if (args.includeDeleted) {
                delete args.includeDeleted;
              } else if (args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            // delete → updateMany with deletedAt = now
            async delete({ args, query }: { args: any; query: any }) {
              return (client as any)[model].update({
                ...args,
                data: { deletedAt: new Date() },
              });
            },

            async deleteMany({ args, query }: { args: any; query: any }) {
              return (client as any)[model].updateMany({
                ...args,
                data: { deletedAt: new Date() },
              });
            },

            // update → don't touch deleted records
            async update({ args, query }: { args: any; query: any }) {
              if (!args.includeDeleted && args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },

            async updateMany({ args, query }: { args: any; query: any }) {
              if (!args.includeDeleted && args.where?.deletedAt === undefined) {
                args.where = { ...args.where, deletedAt: null };
              }
              return query(args);
            },
          },
        ]),
      ),
    },
  }) as T;
}

/**
 * Helper: hard-delete (bypass soft-delete) for GDPR right-to-be-forgotten.
 * Use sparingly.
 */
export async function hardDelete(prisma: PrismaClient, model: string, where: Record<string, unknown>): Promise<unknown> {
  // Reach into the base client (before the extension) to bypass our overrides
  const baseClient = (prisma as any)._baseClient || prisma;
  return await (baseClient as any)[model].delete({ where });
}

/**
 * Helper: restore a soft-deleted record.
 */
export async function restoreSoftDeleted(prisma: PrismaClient, model: string, where: Record<string, unknown>): Promise<unknown> {
  // Use updateMany directly on the extension — but we need to bypass our own
  // 'update' filter (which filters out deleted records). Use the base client.
  const baseClient = (prisma as any)._baseClient || prisma;
  return await (baseClient as any)[model].updateMany({
    where: { ...where, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
}

/**
 * Helper: list deleted records (for admin restore UI).
 */
export async function listDeleted(prisma: PrismaClient, model: string, where: Record<string, unknown> = {}): Promise<unknown[]> {
  const baseClient = (prisma as any)._baseClient || prisma;
  return await (baseClient as any)[model].findMany({
    where: { ...where, deletedAt: { not: null } },
  });
}

/**
 * For test purposes — check whether a model is in the soft-delete list.
 */
export function isSoftDeleteModel(model: string): boolean {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}
