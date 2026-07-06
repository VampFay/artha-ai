import { db } from "@/lib/db";

async function main() {
  const user = await db.user.findFirst({ where: { email: "admin@finsight.ai" } });
  if (!user) { console.error("Admin user not found"); process.exit(1); }
  const userId = user.id;
  console.log("Seeding for admin:", userId);

  // Clear existing
  await Promise.all([
    db.assetHolding.deleteMany({ where: { userId } }),
    db.allocationTarget.deleteMany({ where: { userId } }),
    db.subscription.deleteMany({ where: { userId } }),
    db.liability.deleteMany({ where: { userId } }),
    db.nominee.deleteMany({ where: { userId } }),
    db.estateDocument.deleteMany({ where: { userId } }),
  ]);

  const assets = [
    { name: "Equities (Domestic)", assetClass: "equity_domestic", value: 12500000, color: "#18181b" },
    { name: "Equities (Global)", assetClass: "equity_global", value: 4500000, color: "#3f3f46" },
    { name: "Fixed Income", assetClass: "fixed_income", value: 6000000, color: "#f59e0b" },
    { name: "Real Estate", assetClass: "real_estate", value: 4000000, color: "#71717a" },
    { name: "Cash & Equivalents", assetClass: "cash", value: 800000, color: "#d4d4d8" },
  ];
  for (const a of assets) await db.assetHolding.create({ data: { userId, ...a } });

  const targets = [
    { assetClass: "equity_domestic", targetPct: 45 },
    { assetClass: "equity_global", targetPct: 15 },
    { assetClass: "fixed_income", targetPct: 30 },
    { assetClass: "real_estate", targetPct: 10 },
    { assetClass: "cash", targetPct: 0 },
  ];
  for (const t of targets) await db.allocationTarget.create({ data: { userId, ...t } });

  const subs = [
    { name: "Netflix", amount: 649, frequency: "Monthly" },
    { name: "AWS Cloud", amount: 3200, frequency: "Monthly" },
    { name: "Cult Fitness", amount: 2500, frequency: "Monthly" },
    { name: "Amazon Prime", amount: 1499, frequency: "Yearly" },
    { name: "Adobe Creative Cloud", amount: 4200, frequency: "Monthly" },
  ];
  for (const s of subs) await db.subscription.create({ data: { userId, ...s, status: "Active" } });

  const loans = [
    { name: "Home Loan HDFC", loanType: "home", principal: 12500000, remaining: 9800000, rate: 8.5, emi: 108400, tenureLeftMonths: 184 },
    { name: "Car Loan SBI", loanType: "car", principal: 1500000, remaining: 650000, rate: 9.2, emi: 31500, tenureLeftMonths: 22 },
  ];
  for (const l of loans) await db.liability.create({ data: { userId, ...l } });

  const nominees = [
    { name: "Sarah Connor", relation: "Spouse", allocation: 100, status: "Verified", assets: JSON.stringify(["All Bank Accounts", "Primary Residence", "Term Life Insurance"]) },
    { name: "John Connor", relation: "Child", allocation: 0, status: "Pending Verification", assets: JSON.stringify(["Trust Fund (Age 25)"]) },
  ];
  for (const n of nominees) await db.nominee.create({ data: { userId, ...n } });

  console.log("✅ Admin wealth data seeded");
}

main().catch(console.error).finally(() => db.$disconnect());
