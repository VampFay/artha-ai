"use client";
import { useEffect, useState } from "react";
import { tax, finance } from "@/lib/api";
import { useNav } from "@/lib/nav-context";
import { formatINR, formatPercent } from "@/lib/format";
import type { TaxSummary, FinanceSummary } from "@/lib/api";
import { FileWarning, ArrowRight, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function DashboardContent() {
  const [taxData, setTaxData] = useState<TaxSummary | null>(null);
  const [financeData, setFinanceData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigate } = useNav();
  useEffect(() => { Promise.all([tax.summary().catch(() => null), finance.summary(300000).catch(() => null)]).then(([t, f]) => { setTaxData(t); setFinanceData(f); }).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="space-y-4"><div className="skeleton h-8 w-32" /><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}</div></div>;

  const taxScore = taxData?.score.score ?? 0;
  const finScore = financeData?.score ?? 0;
  const income = financeData?.monthly_income ?? 0;
  const expenses = financeData?.monthly_expenses ?? 0;
  const savings = financeData?.metrics.savings_rate_pct ?? 0;
  const missing = taxData?.missing_documents.length ?? 0;
  const recommended = taxData?.regime_comparison.recommended_regime ?? "new";
  const savingsAmt = taxData?.regime_comparison.savings_amount ?? 0;
  const topCats = financeData?.top_categories ?? [];
  const maxCat = topCats[0]?.amount || 1;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">Overview</p><h1 className="text-heading">Dashboard</h1></div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">

        {/* Tax Score — large dark card (2x2) */}
        <button onClick={() => navigate("tax")} className="col-span-2 row-span-2 bento bento-dark p-7 text-left animate-slide-up stagger-1 relative group">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-500" style={{ background: "var(--color-gold)" }} />
          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Tax Readiness</p>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-display font-mono animate-count">{taxScore}</span>
              <span className="text-lg opacity-40">/100</span>
            </div>
            {/* Score ring */}
            <div className="my-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(250,247,242,0.1)" }}>
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${taxScore}%`, background: "linear-gradient(90deg, var(--color-gold), var(--color-gold-light))" }} />
            </div>
            <div className="flex gap-6 mt-4">
              <div><p className="text-[10px] uppercase tracking-wider opacity-50">Recommended</p><p className="text-sm font-semibold capitalize mt-0.5" style={{ color: "var(--color-gold-light)" }}>{recommended} regime</p></div>
              <div><p className="text-[10px] uppercase tracking-wider opacity-50">You Save</p><p className="text-sm font-semibold font-mono mt-0.5">{formatINR(savingsAmt)}</p></div>
            </div>
            {missing > 0 && <div className="mt-4 flex items-center gap-2 text-xs opacity-70"><FileWarning className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />{missing} document{missing > 1 ? "s" : ""} missing</div>}
          </div>
        </button>

        {/* Health Score — small gold card */}
        <button onClick={() => navigate("finance")} className="bento bento-gold p-5 text-left animate-slide-up stagger-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">Health Score</p>
          <div className="flex items-baseline gap-1"><span className="text-3xl font-mono font-bold animate-count">{finScore}</span><span className="text-sm opacity-60">/100</span></div>
          <p className="text-[10px] opacity-60 mt-1">{financeData ? new Date(financeData.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}</p>
        </button>

        {/* Savings Rate — small light card */}
        <button onClick={() => navigate("finance")} className="bento bento-light p-5 text-left animate-slide-up stagger-3">
          <p className="text-label mb-1">Savings Rate</p>
          <p className="text-2xl font-mono font-bold animate-count" style={{ color: "var(--color-forest)" }}>{formatPercent(savings)}</p>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, savings)}%`, background: "var(--color-forest)" }} /></div>
        </button>

        {/* Income — wide light card (2x1) */}
        <button onClick={() => navigate("finance")} className="col-span-2 bento bento-light p-5 text-left animate-slide-up stagger-4 flex items-center justify-between">
          <div><p className="text-label mb-1">Monthly Income</p><p className="text-2xl font-mono font-bold animate-count" style={{ color: "var(--color-ink)" }}>{formatINR(income)}</p></div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}><TrendingUp className="h-5 w-5" style={{ color: "var(--color-forest)" }} /></div>
        </button>

        {/* Expenses — wide warm card (2x1) */}
        <button onClick={() => navigate("finance")} className="col-span-2 bento bento-warm p-5 text-left animate-slide-up stagger-5 flex items-center justify-between">
          <div><p className="text-label mb-1">Monthly Expenses</p><p className="text-2xl font-mono font-bold animate-count" style={{ color: "var(--color-clay)" }}>{formatINR(expenses)}</p></div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(198,93,58,0.08)" }}><TrendingDown className="h-5 w-5" style={{ color: "var(--color-clay)" }} /></div>
        </button>

        {/* Top categories — mini bar viz (2x1) */}
        <button onClick={() => navigate("finance")} className="col-span-2 bento bento-light p-5 text-left animate-slide-up stagger-6">
          <p className="text-label mb-3">Top Spending Categories</p>
          <div className="space-y-2">
            {topCats.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium w-20 truncate" style={{ color: "var(--color-ink-soft)" }}>{cat.category}</span>
                <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--color-cream-dark)" }}>
                  <div className="h-full rounded-md transition-all duration-1000 ease-out flex items-center justify-end px-2" style={{ width: `${(cat.amount / maxCat) * 100}%`, background: i === 0 ? "var(--color-forest)" : i === 1 ? "var(--color-moss)" : "var(--color-gold)", animationDelay: `${i * 150}ms` }}>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--color-cream)" }}>{formatINR(cat.amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </button>

        {/* Goals quick link — small dark card */}
        <button onClick={() => navigate("goals")} className="bento bento-dark p-5 text-left animate-slide-up stagger-7 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,23,0.2)" }}><Target className="h-4 w-4" style={{ color: "var(--color-gold)" }} /></div>
          <div><p className="text-[10px] uppercase tracking-wider opacity-50">Goals</p><p className="text-sm font-semibold">Emergency Fund</p></div>
        </button>

        {/* Top insight — small warm card */}
        <div className="bento bento-warm p-5 animate-slide-up stagger-7" style={{ borderLeft: "3px solid var(--color-gold)" }}>
          <p className="text-label mb-2">Top Insight</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>{financeData?.suggestions?.[0] || "No suggestions available."}</p>
        </div>
      </div>
    </div>
  );
}
