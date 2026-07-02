"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import ProtectedRoute from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { tax, finance } from "@/lib/api";
import { formatINR, formatPercent } from "@/lib/format";
import type { TaxSummary, FinanceSummary } from "@/lib/api";
import { TrendingUp, TrendingDown, FileWarning, Target, Calculator, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return <ProtectedRoute><AppLayout><DashboardContent /></AppLayout></ProtectedRoute>;
}

function DashboardContent() {
  const [taxData, setTaxData] = useState<TaxSummary | null>(null);
  const [financeData, setFinanceData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([tax.summary().catch(() => null), finance.summary(300000).catch(() => null)])
      .then(([t, f]) => { setTaxData(t); setFinanceData(f); })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  const taxScore = taxData?.score.score ?? 0;
  const finScore = financeData?.score ?? 0;
  const income = financeData?.monthly_income ?? 0;
  const expenses = financeData?.monthly_expenses ?? 0;
  const savings = financeData?.metrics.savings_rate_pct ?? 0;
  const missing = taxData?.missing_documents.length ?? 0;
  const recommended = taxData?.regime_comparison.recommended_regime ?? "new";
  const savingsAmount = taxData?.regime_comparison.savings_amount ?? 0;

  return (
    <div className="space-y-4">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your financial overview at a glance.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(0,1fr)]">
        {/* Tax Score — large */}
        <Link href="/tax" className="md:col-span-2 md:row-span-2 animate-slide-up stagger-1">
          <div className="glass rounded-2xl p-6 card-hover h-full relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${taxScore}%`, transition: "width 800ms cubic-bezier(0.16,1,0.3,1)" }} />
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Calculator className="h-4 w-4 text-emerald-600" /></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tax Readiness</span>
            </div>
            <div className={`text-6xl font-bold tracking-tight animate-count ${taxScore >= 70 ? "text-emerald-600" : "text-amber-500"}`}>{taxScore}<span className="text-2xl text-slate-300">/100</span></div>
            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="text-xs text-slate-400">Recommended Regime</p>
                <p className="text-lg font-semibold text-emerald-600 capitalize">{recommended}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">You Save</p>
                <p className="text-lg font-semibold text-slate-900">{formatINR(savingsAmount)}</p>
              </div>
            </div>
            {missing > 0 && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                <FileWarning className="h-4 w-4" />{missing} document{missing > 1 ? "s" : ""} missing
              </div>
            )}
          </div>
        </Link>

        {/* Finance Score — small */}
        <Link href="/finance" className="animate-slide-up stagger-2">
          <div className="glass rounded-2xl p-5 card-hover h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-sky-50 flex items-center justify-center"><TrendingUp className="h-3.5 w-3.5 text-sky-600" /></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Health Score</span>
            </div>
            <div className={`text-4xl font-bold tracking-tight animate-count ${finScore >= 70 ? "text-emerald-600" : "text-amber-500"}`}>{finScore}<span className="text-lg text-slate-300">/100</span></div>
            <p className="text-xs text-slate-400 mt-1">{financeData ? new Date(financeData.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : ""}</p>
          </div>
        </Link>

        {/* Savings Rate — small */}
        <div className="animate-slide-up stagger-3">
          <div className="glass rounded-2xl p-5 card-hover h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center"><Wallet className="h-3.5 w-3.5 text-violet-600" /></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Savings Rate</span>
            </div>
            <div className="text-4xl font-bold tracking-tight text-slate-900 animate-count">{formatPercent(savings)}</div>
            <p className="text-xs text-slate-400 mt-1">Income saved this month</p>
          </div>
        </div>

        {/* Income — medium */}
        <Link href="/finance" className="animate-slide-up stagger-4">
          <div className="glass rounded-2xl p-5 card-hover h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Income</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatINR(income)}</div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%", transition: "width 800ms" }} /></div>
          </div>
        </Link>

        {/* Expenses — medium */}
        <Link href="/finance" className="animate-slide-up stagger-5">
          <div className="glass rounded-2xl p-5 card-hover h-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Expenses</span>
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatINR(expenses)}</div>
            <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${income > 0 ? (expenses / income) * 100 : 0}%`, transition: "width 800ms" }} /></div>
          </div>
        </Link>

        {/* Goals — medium */}
        <Link href="/goals" className="animate-slide-up stagger-6">
          <div className="glass rounded-2xl p-5 card-hover h-full flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Target className="h-5 w-5 text-emerald-600" /></div>
            <div className="flex-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Goals</span>
              <p className="text-sm font-medium text-slate-900">Emergency Fund</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
          </div>
        </Link>
      </div>

      {/* Top suggestion */}
      {financeData?.suggestions?.[0] && (
        <div className="glass rounded-2xl p-5 animate-slide-up stagger-6 border-l-4 border-emerald-400">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Top Suggestion</span>
          <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">{financeData.suggestions[0]}</p>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 md:row-span-2 skeleton h-64" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
    </div>
  );
}
