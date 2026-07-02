// Seed demo data: creates a demo user + income + expenses + goal
// Run with: bun run /home/z/my-project/scripts/seed-demo.ts
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  // Create demo user
  const existing = await db.user.findUnique({ where: { email: "demo@finsight.ai" } });
  let user = existing;
  if (!user) {
    user = await db.user.create({
      data: { name: "Demo User", email: "demo@finsight.ai", passwordHash: await bcrypt.hash("demo1234", 12) },
    });
    console.log("created demo user:", user.email);
  } else {
    console.log("demo user already exists");
  }

  // Accept consent
  const existingConsent = await db.userConsent.findFirst({ where: { userId: user.id, consentType: "document_processing", revokedAt: null } });
  if (!existingConsent) {
    await db.userConsent.create({
      data: {
        userId: user.id,
        consentType: "document_processing",
        consentText: "FinSight AI needs your permission to process uploaded financial documents for tax-readiness and financial-health analysis. You can delete your documents at any time.",
      },
    });
    console.log("consent accepted");
  }

  // Add income
  const incomeCount = await db.income.count({ where: { userId: user.id } });
  if (incomeCount === 0) {
    await db.income.create({ data: { userId: user.id, incomeType: "salary", source: "Tech Corp India", amount: 1200000, month: 7, financialYear: "2024-25", verified: true } });
    await db.income.create({ data: { userId: user.id, incomeType: "interest", source: "HDFC Savings", amount: 15000, month: 7, financialYear: "2024-25", verified: true } });
    console.log("added 2 incomes");
  }

  // Add expenses
  const expCount = await db.expense.count({ where: { userId: user.id } });
  if (expCount === 0) {
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
    for (const [desc, cat, amt] of expenses) {
      await db.expense.create({ data: { userId: user.id, transactionDate: new Date(2025, 6, 15), description: desc, category: cat, amount: amt } });
    }
    console.log("added 15 expenses");
  }

  // Add goal
  const goalCount = await db.goal.count({ where: { userId: user.id } });
  if (goalCount === 0) {
    await db.goal.create({
      data: { userId: user.id, goalName: "Emergency Fund", targetAmount: 300000, currentAmount: 50000, monthlyContribution: 8000, targetDate: new Date(2026, 11, 31), expectedReturnRate: 0.04 },
    });
    console.log("created goal");
  }

  console.log("\nDemo data ready. Login: demo@finsight.ai / demo1234");
}

main().catch(console.error).finally(() => process.exit(0));
