"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { tax, finance } from "@/lib/api";
import { useNav } from "@/lib/nav-context";
import { formatINR, formatPercent } from "@/lib/format";
import type { TaxSummary, FinanceSummary } from "@/lib/api";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { ProgressRing } from "@/components/motion/progress-ring";
import { Sparkline } from "@/components/motion/sparkline";
import { LiquidProgress } from "@/components/motion/liquid-progress";
import { GradientBars } from "@/components/motion/gradient-bars";
import { FileWarning, ArrowRight, TrendingUp, TrendingDown, Target, Sparkles, Zap } from "lucide-react";

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
  const savingsAmt = taxData?.regime_comparison.savings_amount ?? 0;
  const topCats = financeData?.top_categories ?? [];
  const suggestions = financeData?.suggestions ?? [];

  // Mock 6-month trend for sparkline (varies based on score to feel real)
  const trendSeed = (taxScore + finScore) / 2;
  const trend = Array.from({ length: 8 }, (_, i) => Math.max(20, trendSeed + Math.sin(i * 0.7) * 12 + i * 1.5));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-caption mb-2 flex items-center gap-2">
              <span className="dot dot-live" style={{ background: "var(--color-moss)" }} />Overview
            </p>
            <h1 className="text-heading">Welcome back to your dashboard</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("assistant")}
            className="text-xs font-medium px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />Ask AI Assistant
          </motion.button>
        </div>
      </Reveal>

      {/* BENTO GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

        {/* HERO — Tax Score (2x2) with animated ProgressRing */}
        <Reveal delay={0.05} className="col-span-2 row-span-2">
          <motion.button
            onClick={() => navigate("tax")}
            whileHover={{ y: -4 }}
            className="bento bento-dark p-7 text-left w-full h-full relative shine glow-gold"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">Tax Readiness</p>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "rgba(212,160,23,0.18)", color: "var(--color-gold-light)", border: "1px solid rgba(212,160,23,0.3)" }}>
                FY 2024-25
              </span>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <ProgressRing
                value={taxScore}
                size={130}
                strokeWidth={9}
                color="#d4a017"
                trackColor="rgba(250,247,242,0.08)"
                label={<AnimatedNumber value={taxScore} />}
                sublabel="/ 100"
              />
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Recommended Regime</p>
                <p className="text-2xl font-bold capitalize mb-3" style={{ color: "var(--color-gold-light)" }}>{recommended}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">You Save</p>
                <p className="text-2xl font-mono font-bold">
                  <AnimatedNumber value={savingsAmt} format={(n) => formatINR(n)} />
                </p>
              </div>
            </div>
            {missing > 0 && (
              <div className="mt-5 flex items-center gap-2 text-xs opacity-80">
                <FileWarning className="h-3.5 w-3.5" style={{ color: "var(--color-gold-light)" }} />
                <span>{missing} document{missing > 1 ? "s" : ""} missing — fix to boost your score</span>
                <ArrowRight className="h-3 w-3 ml-auto" />
              </div>
            )}
          </motion.button>
        </Reveal>

        {/* Financial Health — small gold card */}
        <Reveal delay={0.1}>
          <motion.button
            onClick={() => navigate("finance")}
            whileHover={{ y: -4 }}
            className="bento bento-gold p-5 text-left w-full h-full relative shine"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-2">Health Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-mono font-bold">
                <AnimatedNumber value={finScore} />
              </span>
              <span className="text-sm opacity-60">/100</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(250,247,242,0.2)" }}>
              <LiquidProgress value={finScore} height={6} color="rgba(250,247,242,0.95)" trackColor="transparent" duration={1400} showShimmer={false} />
            </div>
            <p className="text-[10px] opacity-70 mt-2 font-medium">
              {financeData ? new Date(financeData.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : ""}
            </p>
          </motion.button>
        </Reveal>

        {/* Savings Rate — small light card with sparkline */}
        <Reveal delay={0.15}>
          <motion.button
            onClick={() => navigate("finance")}
            whileHover={{ y: -4 }}
            className="bento bento-light p-5 text-left w-full h-full"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-label">Savings Rate</p>
              <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--color-moss)" }} />
            </div>
            <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-forest)" }}>
              <AnimatedNumber value={savings} format={(n) => formatPercent(n)} />
            </p>
            <div className="mt-3">
              <Sparkline data={trend} width={140} height={32} color="#0d3b2e" />
            </div>
          </motion.button>
        </Reveal>

        {/* Income — wide light card */}
        <Reveal delay={0.2} className="col-span-2">
          <motion.button
            onClick={() => navigate("finance")}
            whileHover={{ y: -4 }}
            className="bento bento-light p-5 text-left w-full h-full flex items-center justify-between"
          >
            <div>
              <p className="text-label mb-1">Monthly Income</p>
              <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>
                <AnimatedNumber value={income} format={(n) => formatINR(n)} />
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--color-moss)" }}>▲ 8.2% vs last month</p>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
              <TrendingUp className="h-5 w-5" style={{ color: "var(--color-forest)" }} />
            </div>
          </motion.button>
        </Reveal>

        {/* Expenses — wide warm card */}
        <Reveal delay={0.25} className="col-span-2">
          <motion.button
            onClick={() => navigate("finance")}
            whileHover={{ y: -4 }}
            className="bento bento-warm p-5 text-left w-full h-full flex items-center justify-between"
          >
            <div>
              <p className="text-label mb-1">Monthly Expenses</p>
              <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-clay)" }}>
                <AnimatedNumber value={expenses} format={(n) => formatINR(n)} />
              </p>
              <p className="text-[10px] mt-1" style={{ color: "var(--color-clay)" }}>▼ 3.1% vs last month</p>
            </div>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(198,93,58,0.08)" }}>
              <TrendingDown className="h-5 w-5" style={{ color: "var(--color-clay)" }} />
            </div>
          </motion.button>
        </Reveal>

        {/* Top categories — animated bar viz (2x2) */}
        <Reveal delay={0.3} className="col-span-2 row-span-2">
          <motion.button
            onClick={() => navigate("finance")}
            whileHover={{ y: -4 }}
            className="bento bento-light p-6 text-left w-full h-full"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-label">Top Spending Categories</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>{financeData?.top_categories.length || 0} active</p>
              </div>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
                <Zap className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
              </div>
            </div>
            {topCats.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No expense data yet.</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Upload a bank statement to see breakdown.</p>
              </div>
            ) : (
              <GradientBars
                data={topCats.slice(0, 5).map(c => ({ label: c.category, value: c.amount }))}
                orientation="horizontal"
                formatValue={(n) => `₹${(n / 1000).toFixed(1)}k`}
                formatLabel={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
              />
            )}
          </motion.button>
        </Reveal>

        {/* Goals quick link — small dark card */}
        <Reveal delay={0.35}>
          <motion.button
            onClick={() => navigate("goals")}
            whileHover={{ y: -4 }}
            className="bento bento-dark p-5 text-left w-full h-full flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,160,23,0.18)" }}>
              <Target className="h-4 w-4" style={{ color: "var(--color-gold)" }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider opacity-50">Goals</p>
              <p className="text-sm font-semibold">View Plans</p>
            </div>
            <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
          </motion.button>
        </Reveal>

        {/* Top insight — small warm card */}
        <Reveal delay={0.4}>
          <motion.div
            whileHover={{ y: -4 }}
            className="bento bento-warm p-5 w-full h-full relative"
            style={{ borderLeft: "3px solid var(--color-gold)" }}
          >
            <p className="text-label mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: "var(--color-gold)" }} />Top Insight
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>
              {suggestions[0] || "Upload documents to receive personalized insights."}
            </p>
          </motion.div>
        </Reveal>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-72" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">
        <div className="col-span-2 row-span-2 skeleton rounded-[20px]" />
        <div className="skeleton rounded-[20px]" />
        <div className="skeleton rounded-[20px]" />
        <div className="col-span-2 skeleton rounded-[20px]" />
        <div className="col-span-2 skeleton rounded-[20px]" />
        <div className="col-span-2 row-span-2 skeleton rounded-[20px]" />
        <div className="skeleton rounded-[20px]" />
        <div className="skeleton rounded-[20px]" />
      </div>
    </div>
  );
}
