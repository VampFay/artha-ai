/**
 * Seed per-entity users — each institution gets its own login credentials.
 *
 * Creates a dedicated user for each of the 15 test entities.
 * Each user is a tenant_admin of ONLY their entity (data isolation).
 *
 * Usage: bun run scripts/seed-entity-users.ts
 *
 * Login format:
 *   admin@<entity-slug>.artha.ai / <entity-slug>1234
 *
 * Examples:
 *   admin@hdfcbank.artha.ai / hdfcbank1234
 *   admin@iitbombay.artha.ai / iitbombay1234
 *   admin@flipkart.artha.ai / flipkart1234
 */

import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Seeding per-entity users...\n");

  // Get all entities
  const entities = await db.entity.findMany({
    include: {
      teamMembers: true,
    },
  });

  if (entities.length === 0) {
    console.error("✗ No entities found. Run scripts/seed-test-entities.ts first.");
    process.exit(1);
  }

  console.log(`Found ${entities.length} entities\n`);

  // Find the platform admin (to assign as invitedBy)
  const admin = await db.user.findUnique({ where: { email: "admin@finsight.ai" } });
  if (!admin) {
    console.error("✗ admin@finsight.ai not found. Run scripts/seed-demo-users.ts first.");
    process.exit(1);
  }

  // Slugify function
  const slugify = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/^(acme|bharat|hdfc|bajaj|lic|iit|bits|delhi|tata|khaitan|ministry|flipkart|lodha|razorpay|artha).*$/, "$1")
      .substring(0, 20);
  };

  for (const entity of entities) {
    const slug = slugify(entity.name);
    const email = `admin@${slug}.artha.ai`;
    const password = `${slug}1234`;

    try {
      // Check if user already exists
      let user = await db.user.findUnique({ where: { email } });

      if (!user) {
        // Create the entity-specific user
        const passwordHash = await hashPassword(password);
        user = await db.user.create({
          data: {
            email,
            name: `${entity.name} Admin`,
            passwordHash,
            role: "user",
            // No tenantId — they access entities via team membership
          },
        });
        console.log(`  ✓ Created user: ${email}`);
      } else {
        // Update password to ensure it's correct
        const passwordHash = await hashPassword(password);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash, name: `${entity.name} Admin` },
        });
        console.log(`  ✓ Updated user: ${email}`);
      }

      // Check if already a team member of this entity
      const existingMembership = await db.entityTeamMember.findUnique({
        where: { entityId_userId: { entityId: entity.id, userId: user.id } },
      });

      if (!existingMembership) {
        // Add as tenant_admin of this entity
        await db.entityTeamMember.create({
          data: {
            entityId: entity.id,
            userId: user.id,
            role: "tenant_admin",
            invitedBy: admin.id,
            acceptedAt: new Date(),
          },
        });
        console.log(`    → Added as tenant_admin of: ${entity.name}`);
      } else {
        // Update role to ensure tenant_admin
        await db.entityTeamMember.update({
          where: { entityId_userId: { entityId: entity.id, userId: user.id } },
          data: { role: "tenant_admin", isActive: true, acceptedAt: new Date() },
        });
        console.log(`    → Updated as tenant_admin of: ${entity.name}`);
      }

      // Remove this user from any OTHER entities (data isolation)
      const otherMemberships = await db.entityTeamMember.findMany({
        where: {
          userId: user.id,
          entityId: { not: entity.id },
        },
      });
      if (otherMemberships.length > 0) {
        await db.entityTeamMember.deleteMany({
          where: {
            userId: user.id,
            entityId: { not: entity.id },
          },
        });
        console.log(`    → Removed from ${otherMemberships.length} other entit(y/ies)`);
      }

      console.log(`    Password: ${password}`);
      console.log();
    } catch (err: any) {
      console.error(`  ✗ ${entity.name}: ${err.message}\n`);
    }
  }

  // Summary
  console.log("=".repeat(70));
  console.log("✓ Per-entity users created");
  console.log("=".repeat(70));
  console.log("\nEach institution now has its own login:");
  console.log("  Email:    admin@<slug>.artha.ai");
  console.log("  Password: <slug>1234");
  console.log("\nEach user sees ONLY their own entity — full data isolation.\n");

  // Print credential table
  console.log("Credential Reference:");
  console.log("-".repeat(70));
  for (const entity of entities) {
    const slug = slugify(entity.name);
    const email = `admin@${slug}.artha.ai`;
    const password = `${slug}1234`;
    console.log(`  ${entity.name}`);
    console.log(`    ${email} / ${password}`);
  }
  console.log("-".repeat(70));
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
