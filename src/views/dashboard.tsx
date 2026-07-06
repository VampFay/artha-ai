"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { tax, finance } from "@/lib/api";
import { useNav } from "@/lib/nav-context";
import { formatINR, formatPercent } from "@/lib/format";
import type { TaxSummary, FinanceSummary } from "@/lib/api";
import { KineticNumber } from "@/components/motion/kinetic-number";
import { FinancialPulseOrb } from "@/components/motion/financial-pulse-orb";
import { Reveal } from "@/components/motion/reveal";
import { Sparkline } from "@/components/motion/sparkline";
import { LiquidProgress } from "@/components/motion/liquid-progress";
import { GradientBars } from "@/components/motion/gradient-bars";
import { NumberTicker } from "@/components/motion/number-ticker";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { FileWarning, ArrowRight, TrendingUp, TrendingDown, Target, Sparkles, Zap, Activity, Command } from "lucide-react";

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

  const trendSeed = (taxScore + finScore) / 2;
  const trend = Array.from({ length: 8 }, (_, i) => Math.max(20, trendSeed + Math.sin(i * 0.7) * 12 + i * 1.5));

  const tickerItems = [
    { label: "Tax Score", value: `${taxScore}/100`, trend: "up" as const },
    { label: "Health Score", value: `${finScore}/100`, trend: "up" as const },
    { label: "Income", value: formatINR(income), trend: "up" as const },
    { label: "Savings Rate", value: formatPercent(savings), trend: savings > 20 ? "up" as const : "down" as const },
    { label: "Tax Saved", value: formatINR(savingsAmt), trend: "up" as const },
  ];

  return (
    <div className="space-y-5">
      {/* ============ FULL-BLEED HERO STRIP ============ */}
      <Reveal>
        <motion.div
          whileHover={{ y: -2 }}
          className="bento bento-dark p-8 md:p-10 relative overflow-hidden"
          style={{ minHeight: "320px" }}
        >
          {/* OPTIMIZED: Single static radial gradient instead of 2 animated blur blobs */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(at 80% 20%, rgba(212,160,23,0.18) 0%, transparent 50%), radial-gradient(at 20% 80%, rgba(74,124,89,0.15) 0%, transparent 50%)" }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* LEFT: Massive kinetic typography */}
            <div className="flex-1">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2"
                style={{ color: "var(--color-gold-light)" }}
              >
                <span className="live-dot" style={{ background: "var(--color-gold-light)", width: 6, height: 6 }} />
                Tax Readiness · FY 2024-25
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="flex items-baseline gap-4 mb-2"
              >
                <span
                  className="font-mono font-bold leading-none"
                  style={{
                    fontSize: "clamp(5rem, 12vw, 9rem)",
                    background: "linear-gradient(135deg, #e8c14a 0%, #d4a017 50%, #b88810 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.06em",
                  }}
                >
                  <KineticNumber value={taxScore} duration={2000} />
                </span>
                <span className="text-2xl opacity-30 font-mono">/100</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg font-medium mb-4"
                style={{ color: "rgba(250,247,242,0.7)" }}
              >
                {taxScore >= 80 ? "Excellent — you're ready to file." : taxScore >= 60 ? "Good shape — a few tweaks needed." : "Needs attention — let's fix that."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.3)" }}>
                  <Sparkles className="h-3 w-3" style={{ color: "var(--color-gold-light)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--color-gold-light)" }}>{recommended} regime · save {formatINR(savingsAmt)}</span>
                </div>
                {missing > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(198,93,58,0.15)", border: "1px solid rgba(198,93,58,0.3)" }}>
                    <FileWarning className="h-3 w-3" style={{ color: "var(--color-clay-soft)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-clay-soft)" }}>{missing} doc{missing > 1 ? "s" : ""} missing</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* RIGHT: Orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100 }}
              className="flex-shrink-0"
            >
              <FinancialPulseOrb value={taxScore} size={220} label="" />
            </motion.div>
          </div>

          {/* Cmd+K hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px]"
            style={{ color: "rgba(250,247,242,0.4)" }}
          >
            <Command className="h-3 w-3" />
            <span>Press</span>
            <kbd className="font-mono px-1.5 py-0.5 rounded text-[10px]" style={{ background: "rgba(250,247,242,0.1)", border: "1px solid rgba(250,247,242,0.2)" }}>⌘K</kbd>
            <span>for command palette</span>
          </motion.div>
        </motion.div>
      </Reveal>

      {/* ============ LIVE TICKER ============ */}
      <Reveal delay={0.1}>
        <div className="bento bento-light py-3 px-2">
          <NumberTicker items={tickerItems} speed={40} />
        </div>
      </Reveal>

      {/* ============ BROKEN ASYMMETRIC GRID (12-col) ============ */}
      <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">

        {/* Row 1: Income (5 cols) + Expenses (4 cols) + Savings Rate (3 cols) */}
        <Reveal delay={0.15} className="col-span-12 md:col-span-5">
          <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6 h-full">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-label mb-1">Monthly Income</p>
                  <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>
                    <KineticNumber value={income} format={(n) => formatINR(n)} />
                  </p>
                </div>
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
                  <TrendingUp className="h-5 w-5" style={{ color: "var(--color-forest)" }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(74,124,89,0.1)", color: "var(--color-moss)" }}>
                  <TrendingUp className="h-3 w-3" />8.2%
                </span>
                <span style={{ color: "var(--color-ink-muted)" }}>vs last month</span>
              </div>
              <div className="mt-3">
                <Sparkline data={[80, 85, 82, 90, 95, 100]} width={240} height={36} color="#0d3b2e" />
              </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.2} className="col-span-12 md:col-span-4">
          <motion.div whileHover={{ y: -3 }} className="bento bento-warm p-6 h-full">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-label mb-1">Monthly Expenses</p>
                <p className="text-3xl font-mono font-bold" style={{ color: "var(--color-clay)" }}>
                  <KineticNumber value={expenses} format={(n) => formatINR(n)} />
                </p>
              </div>
              <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(198,93,58,0.08)" }}>
                <TrendingDown className="h-5 w-5" style={{ color: "var(--color-clay)" }} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(198,93,58,0.1)", color: "var(--color-clay)" }}>
                <TrendingDown className="h-3 w-3" />3.1%
              </span>
              <span style={{ color: "var(--color-ink-muted)" }}>vs last month</span>
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.25} className="col-span-12 md:col-span-3">
          <motion.div whileHover={{ y: -3 }} className="bento bento-gold p-6 h-full">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-2">Savings Rate</p>
            <p className="text-4xl font-mono font-bold">
              <KineticNumber value={savings} format={(n) => formatPercent(n)} />
            </p>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(250,247,242,0.2)" }}>
              <LiquidProgress value={savings} height={6} color="rgba(250,247,242,0.95)" trackColor="transparent" duration={1400} showShimmer={false} />
            </div>
            <p className="text-[10px] opacity-70 mt-2 font-medium">Health: <span className="font-mono font-bold"><KineticNumber value={finScore} /></span>/100</p>
          </motion.div>
        </Reveal>

        {/* Row 2: Top categories (7 cols, tall) + Quick Actions (5 cols) */}
        <Reveal delay={0.3} className="col-span-12 md:col-span-7 row-span-2">
          <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-label">Top Spending Categories</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>{financeData?.top_categories.length || 0} active · live breakdown</p>
                </div>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
                  <Zap className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
                </div>
              </div>
              {topCats.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No expense data yet.</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Upload a bank statement CSV to see breakdown.</p>
                </div>
              ) : (
                <GradientBars
                  data={topCats.slice(0, 6).map(c => ({ label: c.category, value: c.amount }))}
                  orientation="horizontal"
                  formatValue={(n) => `₹${(n / 1000).toFixed(1)}k`}
                  formatLabel={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
                />
              )}
          </motion.div>
        </Reveal>

        <Reveal delay={0.35} className="col-span-12 md:col-span-5">
          <motion.div whileHover={{ y: -3 }} className="bento bento-dark p-6 h-full">
            <p className="text-[10px] uppercase tracking-wider opacity-50 mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Upload", icon: Activity, page: "documents", color: "var(--color-gold-light)" },
                { label: "Ask AI", icon: Sparkles, page: "assistant", color: "var(--color-gold-light)" },
                { label: "Goals", icon: Target, page: "goals", color: "var(--color-gold-light)" },
                { label: "Reports", icon: ArrowRight, page: "reports", color: "var(--color-gold-light)" },
              ].map((a, i) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(a.page as any)}
                    className="flex flex-col items-start gap-2 p-3 rounded-xl text-left transition-colors"
                    style={{ background: "rgba(250,247,242,0.05)", border: "1px solid rgba(250,247,242,0.08)" }}
                  >
                    <Icon className="h-4 w-4" style={{ color: a.color }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-cream)" }}>{a.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.4} className="col-span-12 md:col-span-5">
          <motion.div
            whileHover={{ y: -3 }}
            className="bento bento-warm p-6 h-full relative"
            style={{ borderLeft: "3px solid var(--color-gold)" }}
          >
            <p className="text-label mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" style={{ color: "var(--color-gold)" }} />AI Insight
            </p>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-ink-soft)" }}>
              {suggestions[0] || "Upload documents to receive personalized insights powered by AI."}
            </p>
            <MagneticButton
              onClick={() => navigate("assistant")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              style={{ background: "rgba(13,59,46,0.06)", color: "var(--color-forest)" }}
            >
              Ask follow-up <ArrowRight className="h-3 w-3" />
            </MagneticButton>
          </motion.div>
        </Reveal>

        {/* Row 3: Score breakdown (full width) */}
        <Reveal delay={0.45} className="col-span-12">
          <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-label">Score Breakdown</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Tax readiness components</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-ink-muted)" }}>Total</p>
                  <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-forest)" }}>
                    <KineticNumber value={taxScore} />/100
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Documents", val: taxData?.score.breakdown.document_completeness || 0, max: 40, color: "#0d3b2e" },
                  { label: "Verification", val: taxData?.score.breakdown.data_verification || 0, max: 25, color: "#4a7c59" },
                  { label: "Consistency", val: taxData?.score.breakdown.income_consistency || 0, max: 20, color: "#d4a017" },
                  { label: "Deductions", val: taxData?.score.breakdown.deduction_proof || 0, max: 15, color: "#c65d3a" },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: "var(--color-ink-soft)" }}>{b.label}</span>
                      <span className="font-mono font-semibold" style={{ color: b.color }}>
                        <KineticNumber value={b.val} />/{b.max}
                      </span>
                    </div>
                    <LiquidProgress
                      value={b.val}
                      max={b.max}
                      height={6}
                      color={`linear-gradient(90deg, ${b.color}, ${b.color}cc)`}
                      trackColor="rgba(13,59,46,0.06)"
                      showShimmer={false}
                    />
                  </motion.div>
                ))}
              </div>
          </motion.div>
        </Reveal>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-80 rounded-[20px]" />
      <div className="skeleton h-12 rounded-[20px]" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 skeleton h-32 rounded-[20px]" />
        <div className="col-span-4 skeleton h-32 rounded-[20px]" />
        <div className="col-span-3 skeleton h-32 rounded-[20px]" />
        <div className="col-span-7 skeleton h-64 rounded-[20px]" />
        <div className="col-span-5 skeleton h-32 rounded-[20px]" />
        <div className="col-span-5 skeleton h-32 rounded-[20px]" />
        <div className="col-span-12 skeleton h-40 rounded-[20px]" />
      </div>
    </div>
  );
}
