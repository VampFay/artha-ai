/**
 * Seed demo users shown on the login screen.
 * Usage: bun run scripts/seed-demo-users.ts
 */

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Seeding demo users...");

  const demoUsers = [
    { name: "Test User", email: "test@finsight.ai", password: "test1234", role: "user" },
    { name: "Admin User", email: "admin@finsight.ai", password: "admin1234", role: "admin" },
  ];

  for (const u of demoUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Update password + role to ensure demo creds work
      const passwordHash = await hashPassword(u.password);
      await db.user.update({
        where: { email: u.email },
        data: { passwordHash, role: u.role, name: u.name },
      });
      console.log(`  ✓ Updated: ${u.email} (${u.role})`);
    } else {
      const passwordHash = await hashPassword(u.password);
      await db.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash,
          role: u.role,
        },
      });
      console.log(`  ✓ Created: ${u.email} (${u.role})`);
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
