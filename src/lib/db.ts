import { PrismaClient } from '@prisma/client'
import { withSoftDelete } from '@/lib/db-soft-delete'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// WP2.4 — instantiate Prisma with soft-delete extension
// (auto-converts DELETE → UPDATE deletedAt=now on financial models)
function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ["error"] : ["error", "warn"],
  });
  // Wrap with soft-delete extension
  const extended = withSoftDelete(base);
  // Stash the base client for hard-delete / restore helpers (GDPR compliance)
  (extended as any)._baseClient = base;
  return extended;
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient() as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
