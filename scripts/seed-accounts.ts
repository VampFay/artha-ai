// Seed: creates admin + test user with consent + demo financial data
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const CONSENT_TEXT = "FinSight AI needs your permission to process uploaded financial documents for tax-readiness and financial-health analysis. You can delete your documents at any time.";

async function createUser(email: string, name: string, password: string, role: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Update role if different
    if (existing.role !== role) {
      await db.user.update({ where: { id: existing.id }, data: { role } });
      console.log(`updated ${email} role to ${role}`);
    } else {
      console.log(`${email} already exists (role: ${role})`);
    }
    return existing;
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12), role },
  });
  console.log(`created ${email} (role: ${role})`);

  // Accept consent
  const hasConsent = await db.userConsent.findFirst({ where: { userId: user.id, consentType: "document_processing", revokedAt: null } });
  if (!hasConsent) {
    await db.userConsent.create({ data: { userId: user.id, consentType: "document_processing", consentText: CONSENT_TEXT } });
  }

  // Add income + expenses + goal if not already there
  const incomeCount = await db.income.count({ where: { userId: user.id } });
  if (incomeCount === 0) {
    const now = new Date();
    await db.income.create({ data: { userId: user.id, incomeType: "salary", source: "Tech Corp India", amount: 1200000, month: now.getMonth() + 1, financialYear: "2024-25", verified: true } });
    await db.income.create({ data: { userId: user.id, incomeType: "interest", source: "HDFC Savings", amount: 15000, month: now.getMonth() + 1, financialYear: "2024-25", verified: true } });

    const expenses = [
      ["SWIGGY food order", "Food", 450], ["ZOMATO food delivery", "Food", 380],
      ["NETFLIX monthly subscription", "Subscriptions", 649], ["PRIME video subscription", "Subscriptions", 1499],
      ["House RENT payment", "Rent", 25000], ["UBER ride to office", "Travel", 285],
      ["ATM cash withdrawal", "Cash Withdrawal", 5000], ["SIP mutual fund investment", "Investment", 10000],
      ["EMI car loan", "EMI / Loan", 8500], ["PHARMACY medical store", "Medical", 320],
      ["AMAZON shopping order", "Shopping", 2200], ["IRCTC train ticket", "Travel", 850],
      ["DOMINOS pizza order", "Food", 650], ["HOSPITAL medical bill", "Medical", 1500],
      ["UDEMY course purchase", "Education", 499],
    ];
    const mid = new Date(now.getFullYear(), now.getMonth(), 15);
    for (const [desc, cat, amt] of expenses) {
      await db.expense.create({ data: { userId: user.id, transactionDate: mid, description: desc, category: cat, amount: amt } });
    }

    await db.goal.create({
      data: { userId: user.id, goalName: "Emergency Fund", targetAmount: 300000, currentAmount: 50000, monthlyContribution: 8000, targetDate: new Date(2026, 11, 31), expectedReturnRate: 0.04 },
    });
    console.log(`  added demo data for ${email}`);
  }
  return user;
}

async function main() {
  console.log("Seeding accounts...\n");

  // Admin account
  await createUser("admin@finsight.ai", "Admin User", "admin1234", "admin");

  // Test user account
  await createUser("test@finsight.ai", "Test User", "test1234", "user");

  // Also keep the original demo account
  await createUser("demo@finsight.ai", "Demo User", "demo1234", "user");

  console.log("\n========================================");
  console.log("Accounts ready:");
  console.log("  Admin:  admin@finsight.ai / admin1234");
  console.log("  Test:   test@finsight.ai / test1234");
  console.log("  Demo:   demo@finsight.ai / demo1234");
  console.log("========================================");
}

main().catch(console.error).finally(() => process.exit(0));
