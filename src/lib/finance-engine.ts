// Finance engine: classifier + metrics + score
import { db } from "@/lib/db";

const CATEGORIES: Record<string, string[]> = {
  Food: ["SWIGGY", "ZOMATO", "RESTAURANT", "DOMINOS", "PIZZA", "BURGER", "FOOD"],
  Rent: ["RENT", "LANDLORD", "HOUSE RENT"],
  Travel: ["UBER", "OLA", "IRCTC", "METRO", "FUEL", "PETROL", "TRAIN"],
  Shopping: ["AMAZON", "FLIPKART", "MYNTRA", "AJIO", "SHOP"],
  Education: ["UDEMY", "COURSE", "TUITION", "SCHOOL", "COLLEGE", "FEE"],
  Medical: ["PHARMACY", "HOSPITAL", "DOCTOR", "MEDICAL", "CLINIC", "MEDICINE"],
  Entertainment: ["MOVIE", "PVR", "BOOKMYSHOW", "GAME", "STEAM"],
  Subscriptions: ["NETFLIX", "PRIME", "SPOTIFY", "HOTSTAR", "DISNEY", "YOUTUBE PREMIUM"],
  "EMI / Loan": ["EMI", "LOAN", "INSTALLMENT"],
  Investment: ["SIP", "MUTUAL FUND", "ZERODHA", "GROWW", "INVESTMENT", "STOCK"],
  Transfer: ["TRANSFER", "IMPS", "NEFT", "RTGS", "UPI"],
  "Cash Withdrawal": ["ATM", "CASH WDL", "CASH WITHDRAWAL"],
  Other: [],
};

export function classifyTransaction(desc: string): string {
  if (!desc) return "Other";
  const upper = desc.toUpperCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (cat === "Other") continue;
    for (const kw of keywords) if (upper.includes(kw)) return cat;
  }
  return "Other";
}

export async function computeFinanceSummary(userId: string, month: Date, emergencyFund: number) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 1);

  // Filter income by both month AND year to prevent cross-year double-counting
  const fy = month.getFullYear();
  const fyStart = `${fy}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
  const incomes = await db.income.findMany({ where: { userId, verified: true, month: month.getMonth() + 1, financialYear: { contains: String(fy).slice(2) } } });
  const expenses = await db.expense.findMany({ where: { userId, transactionDate: { gte: monthStart, lt: monthEnd } } });

  const income = incomes.reduce((s, i) => s + i.amount, 0);
  const exp = expenses.reduce((s, e) => s + e.amount, 0);
  const savingsRate = income > 0 ? ((income - exp) / income) * 100 : 0;
  const emi = expenses.filter((e) => e.category === "EMI / Loan").reduce((s, e) => s + e.amount, 0);
  const di = income > 0 ? (emi / income) * 100 : 0;
  const essential = expenses.filter((e) => ["Rent", "Food", "Medical", "EMI / Loan"].includes(e.category)).reduce((s, e) => s + e.amount, 0);
  const efMonths = essential > 0 ? emergencyFund / essential : 0;
  const subs = expenses.filter((e) => e.category === "Subscriptions").reduce((s, e) => s + e.amount, 0);

  // Top categories
  const catMap: Record<string, number> = {};
  for (const e of expenses) catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  const top = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat, amt]) => ({ category: cat, amount: amt, percentage: exp > 0 ? (amt / exp) * 100 : 0 }));

  // Score
  const savingsPts = Math.min(1, savingsRate / 30) * 30;
  const diPts = Math.max(0, 1 - di / 20) * 25;
  const efPts = Math.min(1, efMonths / 6) * 25;
  const subsPct = income > 0 ? (subs / income) * 100 : 0;
  const subsPts = Math.max(0, 1 - subsPct / 5) * 10;
  const stabilityPts = 10;
  const score = Math.round(savingsPts + diPts + efPts + subsPts + stabilityPts);

  const suggestions: string[] = [];
  if (savingsRate < 20) suggestions.push(`Increase your savings rate (currently ${savingsRate.toFixed(1)}%). Aim for 20%+.`);
  if (di > 30) suggestions.push(`Reduce your debt-to-income ratio (currently ${di.toFixed(1)}%).`);
  if (efMonths < 3) suggestions.push(`Build your emergency fund (currently ${efMonths.toFixed(1)} months). Aim for 3-6 months.`);
  if (subsPct > 5) suggestions.push(`Review subscriptions (₹${subs.toFixed(0)}/month = ${subsPct.toFixed(1)}% of income).`);
  if (suggestions.length === 0) suggestions.push("Your financial health looks good! Keep maintaining your current habits.");

  return {
    month: monthStart.toISOString(),
    score,
    score_breakdown: { savings_rate: savingsPts, debt_to_income: diPts, emergency_fund: efPts, subscription_control: subsPts, expense_stability: stabilityPts },
    metrics: { savings_rate_pct: savingsRate, debt_to_income_pct: di, emergency_fund_months: efMonths, subscription_total: subs, subscription_pct_of_income: subsPct },
    monthly_income: income,
    monthly_expenses: exp,
    top_categories: top,
    suggestions: suggestions.slice(0, 3),
  };
}
