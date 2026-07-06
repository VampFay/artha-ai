"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { KineticNumber } from "@/components/ui/KineticNumber";

interface Subscription { id: string; name: string; amount: number; frequency: string; status: string; }

export default function CashflowView() {
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions">("overview");
  const [summary, setSummary] = useState<any>(null);
  const [incomeExpense, setIncomeExpense] = useState<any[]>([]);
  const [topExpenses, setTopExpenses] = useState<any[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    Promise.all([
      fetch("/api/cashflow/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/cashflow/income-vs-expenses?months=6", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/cashflow/expenses", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/subscriptions", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([s, ie, te, sub]) => {
      setSummary(s);
      setIncomeExpense(ie?.items || []);
      setTopExpenses(te?.items || []);
      setSubs(sub?.items || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-6 lg:px-12 py-20 max-w-[1200px] mx-auto">
      <div className="skeleton h-16 w-72 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="skeleton h-48" /><div className="skeleton h-48" /><div className="skeleton h-48" /></div>
    </div>
  );

  const freeCashFlow = summary?.freeCashFlow || 0;
  const runwayMonths = summary?.runwayMonths || 0;
  const burnRate = summary?.burnRate || 0;
  const liquidAmount = summary?.liquidAmount || 0;
  const savingsRate = summary?.savingsRate || 0;
  const fixedExpenses = summary?.fixedExpenses || 0;
  const maxIE = Math.max(...incomeExpense.map(d => Math.max(d.income, d.expense)), 1);

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto w-full">
      <div className="py-12 md:py-20 border-b border-carbon/10 mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Cashflow & Liquidity</span>
        </motion.div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon mb-2">
              <span className="font-serif italic text-stone text-3xl md:text-5xl mr-2">₹</span>
              <KineticNumber value={freeCashFlow} />
            </h1>
            <p className="text-xs font-mono text-stone-dark"><span className="text-carbon font-medium">Monthly Free Cash Flow</span></p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab("overview")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "overview" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Overview</button>
            <button onClick={() => setActiveTab("subscriptions")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "subscriptions" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Subscriptions</button>
          </div>
        </div>
      </div>

      {activeTab === "overview" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
          {/* Income vs Expenses chart */}
          <div>
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-8">Income vs Expenses (YTD)</h3>
            {incomeExpense.length === 0 ? (
              <p className="text-sm text-stone py-8 text-center">No cashflow data yet. Upload a bank statement to see your income vs expenses trend.</p>
            ) : (
              <div className="flex items-end gap-4 md:gap-8 h-48 border-b border-carbon/10 pb-2">
                {incomeExpense.map((d, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(d.income / maxIE) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} className="w-4 md:w-6 bg-carbon rounded-t-sm" title={`Income: ₹${d.income.toLocaleString("en-IN")}`} />
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(d.expense / maxIE) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 + 0.1 }} className="w-4 md:w-6 bg-saffron rounded-t-sm" title={`Expense: ₹${d.expense.toLocaleString("en-IN")}`} />
                    <span className="absolute -mb-6 text-[10px] text-stone font-mono">{d.month}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top expenses + liquidity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-8">Top Expenses</h3>
              {topExpenses.length === 0 ? (
                <p className="text-sm text-stone py-8 text-center">No expense data this month.</p>
              ) : (
                <div className="space-y-4">
                  {topExpenses.map((e, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-stone w-6">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm text-carbon font-medium">{e.category}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-stone">₹{e.amount.toLocaleString("en-IN")}</span>
                        {e.trend !== 0 && <span className={cn("text-[10px] font-bold", e.trend > 0 ? "text-red-500" : "text-emerald-600")}>{e.trend > 0 ? "+" : ""}{e.trend.toFixed(0)}%</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-carbon text-white p-8">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-6">Liquidity Runway</h3>
              <div className="text-4xl font-light mb-1"><KineticNumber value={runwayMonths} format={(v) => v.toFixed(1)} /><span className="text-lg text-stone ml-2">months</span></div>
              <p className="text-xs text-stone mt-4 mb-6">Burn rate: <span className="text-white font-mono">₹{burnRate.toLocaleString("en-IN")}/mo</span></p>
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-xs"><span className="text-stone">Liquid Assets</span><span className="text-white font-mono">₹{liquidAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-xs"><span className="text-stone">Savings Rate</span><span className="text-white font-mono">{savingsRate.toFixed(0)}%</span></div>
                <div className="flex justify-between text-xs"><span className="text-stone">Fixed Expenses</span><span className="text-white font-mono">₹{fixedExpenses.toLocaleString("en-IN")}</span></div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Active Subscriptions</h3>
            <span className="text-xs text-stone">{subs.length} active</span>
          </div>
          {subs.length === 0 ? (
            <p className="text-sm text-stone py-12 text-center">No active subscriptions on record.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subs.map((sub, i) => (
                <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-6 border border-carbon/10 bg-[#FAFAFA] hover:border-carbon/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-medium text-carbon">{sub.name}</h4>
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded", sub.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-stone/20 text-stone")}>{sub.status}</span>
                  </div>
                  <div className="text-2xl font-light text-carbon"><span className="font-serif italic text-stone text-lg mr-1">₹</span><KineticNumber value={sub.amount} /></div>
                  <p className="text-[10px] text-stone uppercase tracking-wider mt-2">{sub.frequency}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
