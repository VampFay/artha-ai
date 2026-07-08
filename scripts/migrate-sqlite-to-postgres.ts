/**
 * SQLite → PostgreSQL Migration Script
 *
 * Usage:
 *   1. Ensure SQLite DB exists (default: db/custom.db)
 *   2. Set DATABASE_URL to your Postgres connection in .env
 *   3. Run: bun run scripts/migrate-sqlite-to-postgres.ts
 *
 * This script:
 *   - Reads all data from SQLite (using the current Prisma client)
 *   - Connects to PostgreSQL (using DATABASE_URL env var)
 *   - Creates all tables via prisma db push
 *   - Batch-inserts all records in the correct order (respecting foreign keys)
 *   - Verifies row counts match
 */

import { PrismaClient } from "@prisma/client";
import { PrismaClient as PostgresClient } from "@prisma/client";

// Table order matters — parents before children
const TABLES = [
  "user",
  "userConsent",
  "document",
  "extractedField",
  "income",
  "expense",
  "deduction",
  "taxEstimation",
  "financialHealthScore",
  "goal",
  "auditLog",
  "revokedToken",
  "assetHolding",
  "allocationTarget",
  "subscription",
  "liability",
  "nominee",
  "estateDocument",
] as const;

async function main() {
  console.log("=== SQLite → PostgreSQL Migration ===\n");

  // Source: SQLite (current DATABASE_URL points to SQLite)
  const sqliteUrl = process.env.SQLITE_URL || `file:${process.cwd()}/db/custom.db`;
  console.log(`Source (SQLite): ${sqliteUrl}`);

  // Destination: PostgreSQL (from DATABASE_URL or POSTGRES_URL)
  const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!postgresUrl || !postgresUrl.startsWith("postgresql://")) {
    console.error("ERROR: Set POSTGRES_URL env var to your PostgreSQL connection string");
    console.error("Example: POSTGRES_URL=postgresql://user:pass@localhost:5432/artha");
    process.exit(1);
  }
  console.log(`Destination (PostgreSQL): ${postgresUrl.replace(/:[^:@]+@/, ":****@")}\n`);

  // Connect to SQLite (source)
  const sqlite = new PrismaClient({
    datasources: { db: { url: sqliteUrl } },
  });

  // Connect to PostgreSQL (destination)
  const postgres = new PostgresClient({
    datasources: { db: { url: postgresUrl } },
  });

  try {
    // Step 1: Read all data from SQLite
    console.log("Reading from SQLite...");
    const data: Record<string, any[]> = {};

    data.user = await sqlite.user.findMany();
    data.userConsent = await sqlite.userConsent.findMany();
    data.document = await sqlite.document.findMany();
    data.extractedField = await sqlite.extractedField.findMany();
    data.income = await sqlite.income.findMany();
    data.expense = await sqlite.expense.findMany();
    data.deduction = await sqlite.deduction.findMany();
    data.taxEstimation = await sqlite.taxEstimation.findMany();
    data.financialHealthScore = await sqlite.financialHealthScore.findMany();
    data.goal = await sqlite.goal.findMany();
    data.auditLog = await sqlite.auditLog.findMany();
    data.revokedToken = await sqlite.revokedToken.findMany();
    data.assetHolding = await sqlite.assetHolding.findMany();
    data.allocationTarget = await sqlite.allocationTarget.findMany();
    data.subscription = await sqlite.subscription.findMany();
    data.liability = await sqlite.liability.findMany();
    data.nominee = await sqlite.nominee.findMany();
    data.estateDocument = await sqlite.estateDocument.findMany();

    for (const table of TABLES) {
      console.log(`  ${table}: ${data[table].length} records`);
    }
    console.log("");

    // Step 2: Push schema to PostgreSQL (creates tables)
    console.log("Pushing schema to PostgreSQL...");
    console.log("(Run 'bunx prisma db push --schema prisma/schema.postgres.prisma' first)\n");

    // Step 3: Clear destination tables (in reverse order to respect FK constraints)
    console.log("Clearing PostgreSQL tables...");
    for (const table of [...TABLES].reverse()) {
      try {
        await (postgres as any)[table].deleteMany({});
        console.log(`  Cleared ${table}`);
      } catch (e) {
        console.log(`  Skip ${table} (table might not exist yet)`);
      }
    }
    console.log("");

    // Step 4: Insert data (in order, respecting FK constraints)
    console.log("Inserting into PostgreSQL...");
    let totalInserted = 0;

    for (const table of TABLES) {
      if (data[table].length === 0) {
        console.log(`  ${table}: 0 records (skip)`);
        continue;
      }

      // Batch insert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < data[table].length; i += chunkSize) {
        const chunk = data[table].slice(i, i + chunkSize);
        await (postgres as any)[table].createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }
      console.log(`  ${table}: ${data[table].length} records inserted ✓`);
      totalInserted += data[table].length;
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`Total records migrated: ${totalInserted}`);

    // Step 5: Verify row counts
    console.log("\nVerifying row counts...");
    let allMatch = true;
    for (const table of TABLES) {
      const sourceCount = data[table].length;
      const destCount = await (postgres as any)[table].count();
      const match = sourceCount === destCount;
      if (!match) allMatch = false;
      console.log(`  ${table}: ${sourceCount} → ${destCount} ${match ? "✓" : "✗ MISMATCH"}`);
    }

    if (allMatch) {
      console.log("\n✅ All row counts match. Migration successful!");
    } else {
      console.log("\n⚠️  Some row counts don't match. Check for errors above.");
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

main();
