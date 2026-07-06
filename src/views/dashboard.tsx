"use client";
import { useEffect, useState } from "react";
import { tax, finance } from "@/lib/api";
import { useNav } from "@/lib/nav-context";
import { formatINR, formatPercent } from "@/lib/format";
import type { TaxSummary, FinanceSummary } from "@/lib/api";
import { TrendingUp, TrendingDown, FileWarning, ArrowRight } from "lucide-react";

export default function DashboardContent() {
  const [taxData, setTaxData] = useState<TaxSummary | null>(null);
  const [financeData, setFinanceData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { navigate } = useNav();

  useEffect(() => {
    Promise.all([tax.summary().catch(() => null), finance.summary(300000).catch(() => null)])
      .then(([t, f]) => { setTaxData(t); setFinanceData(f); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const taxScore = taxData?.score.score ?? 0;
  const finScore = financeData?.score ?? 0;
  const income = financeData?.monthly_income ?? 0;
  const expenses = financeData?.monthly_expenses ?? 0;
  const savings = financeData?.metrics.savings_rate_pct ?? 0;
  const missing = taxData?.missing_documents.length ?? 0;
  const recommended = taxData?.regime_comparison.recommended_regime ?? "new";
  const savingsAmount = taxData?.regime_comparison.savings_amount ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="animate-slide-up">
        <p className="text-caption mb-1">Overview</p>
        <h1 className="text-heading">Dashboard</h1>
      </div>

      {/* Hero score card */}
      <button onClick={() => navigate("tax")} className="block w-full text-left animate-slide-up stagger-1">
        <div className="card-featured p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5" style={{ background: "var(--color-gold)" }} />
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">Tax Readiness Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-display font-mono">{taxScore}</span>
                <span className="text-lg opacity-50">/100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60 mb-1">You Save</p>
              <p className="text-2xl font-mono font-semibold" style={{ color: "var(--color-gold-light)" }}>{formatINR(savingsAmount)}</p>
              <p className="text-xs opacity-60 mt-0.5">with {recommended} regime</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: "rgba(250,247,242,0.1)" }}>
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${taxScore}%`, background: "var(--color-gold)" }} />
          </div>
          {missing > 0 && (
            <div className="flex items-center gap-2 text-sm opacity-80">
              <FileWarning className="h-4 w-4" style={{ color: "var(--color-gold-light)" }} />
              {missing} document{missing > 1 ? "s" : ""} missing — upload to improve score
            </div>
          )}
        </div>
      </button>

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Health Score" value={`${finScore}`} suffix="/100" delay="stagger-2" onClick={() => navigate("finance")} color={finScore >= 70 ? "var(--color-forest)" : "var(--color-clay)"} />
        <MetricCard label="Monthly Income" value={formatINR(income)} delay="stagger-3" onClick={() => navigate("finance")} />
        <MetricCard label="Monthly Expenses" value={formatINR(expenses)} delay="stagger-4" onClick={() => navigate("finance")} />
        <MetricCard label="Savings Rate" value={formatPercent(savings)} delay="stagger-5" onClick={() => navigate("finance")} color="var(--color-forest)" />
      </div>

      {/* Insights row */}
      <div className="grid md:grid-cols-2 gap-4 animate-slide-up stagger-6">
        {/* Top suggestion */}
        {financeData?.suggestions?.[0] && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="dot" style={{ background: "var(--color-gold)" }} />
              <p className="text-caption">Top Insight</p>
            </div>
            <p className="text-body leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>{financeData.suggestions[0]}</p>
          </div>
        )}
        {/* Quick actions */}
        <div className="card p-6">
          <p className="text-caption mb-4">Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: "Upload Document", page: "documents" as const },
              { label: "View Tax Breakdown", page: "tax" as const },
              { label: "Create Financial Goal", page: "goals" as const },
            ].map((a) => (
              <button key={a.label} onClick={() => navigate(a.page)} className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors text-sm font-medium"
                style={{ color: "var(--color-ink-soft)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-cream-dark)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                {a.label}<ArrowRight className="h-3.5 w-3.5" style={{ color: "var(--color-ink-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, suffix, delay, onClick, color }: { label: string; value: string; suffix?: string; delay: string; onClick: () => void; color?: string }) {
  return (
    <button onClick={onClick} className={`card p-5 text-left animate-slide-up ${delay} transition-all duration-300 hover:shadow-md`}>
      <p className="text-label mb-2">{label}</p>
      <p className="text-xl font-mono font-semibold animate-count" style={{ color: color || "var(--color-ink)" }}>{value}<span className="text-sm font-normal" style={{ color: "var(--color-ink-muted)" }}>{suffix}</span></p>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-6 w-24" />
      <div className="skeleton h-48 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}</div>
    </div>
  );
}
