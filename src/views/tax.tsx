"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { tax } from "@/lib/api";
import { formatINR } from "@/lib/format";
import type { TaxSummary } from "@/lib/api";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { ProgressRing } from "@/components/motion/progress-ring";
import { LiquidProgress } from "@/components/motion/liquid-progress";
import { FileWarning, Check, TrendingDown, Info } from "lucide-react";

export default function TaxContent() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { tax.summary().then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 row-span-2 skeleton rounded-[20px] h-72" />
        <div className="skeleton rounded-[20px] h-32" />
        <div className="skeleton rounded-[20px] h-32" />
        <div className="col-span-2 skeleton rounded-[20px] h-32" />
      </div>
    </div>
  );
  if (!data) return null;
  const r = data.regime_comparison;
  const breakdown = [
    { label: "Document Completeness", val: data.score.breakdown.document_completeness, max: 40, color: "#d4a017" },
    { label: "Data Verification", val: data.score.breakdown.data_verification, max: 25, color: "#4a7c59" },
    { label: "Income Consistency", val: data.score.breakdown.income_consistency, max: 20, color: "#1a5c47" },
    { label: "Deduction Proof", val: data.score.breakdown.deduction_proof, max: 15, color: "#c65d3a" },
  ];
  const totalIncome = Object.values(data.income_summary).reduce((a: number, b: any) => a + Number(b || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-caption mb-2 flex items-center gap-2">
              <span className="dot dot-live" style={{ background: "var(--color-gold)" }} />FY {data.financial_year}
            </p>
            <h1 className="text-heading">Tax Readiness</h1>
          </div>
          <div className="text-right">
            <p className="text-label">Assessed</p>
            <p className="text-xs font-mono" style={{ color: "var(--color-ink-soft)" }}>{new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>
      </Reveal>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

        {/* Hero — score ring + breakdown */}
        <Reveal delay={0.05} className="col-span-2 row-span-2">
          <motion.div whileHover={{ y: -4 }} className="bento bento-dark p-7 w-full h-full relative overflow-hidden">
            <motion.div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 60%)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-3">Tax Readiness Score</p>
              <div className="flex items-center gap-6 mb-6">
                <ProgressRing
                  value={data.score.score}
                  size={140}
                  strokeWidth={10}
                  color="#d4a017"
                  trackColor="rgba(250,247,242,0.08)"
                  label={<AnimatedNumber value={data.score.score} />}
                  sublabel="/ 100"
                />
                <div className="flex-1 space-y-3">
                  {breakdown.map((b, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[10px] uppercase tracking-wider opacity-70 mb-1">
                        <span>{b.label}</span>
                        <span className="font-mono">{b.val}/{b.max}</span>
                      </div>
                      <LiquidProgress
                        value={b.val}
                        max={b.max}
                        height={5}
                        color={`linear-gradient(90deg, ${b.color}, ${b.color}cc)`}
                        trackColor="rgba(250,247,242,0.08)"
                        showShimmer={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* Old regime card */}
        <Reveal delay={0.1}>
          <motion.div
            whileHover={{ y: -4 }}
            className="bento bento-light p-5 w-full h-full relative"
            style={r.recommended_regime === "old" ? { borderColor: "var(--color-forest)", borderWidth: "2px" } : {}}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>Old Regime</span>
              {r.recommended_regime === "old" && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                  className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}
                >
                  <Check className="h-2.5 w-2.5" />Best
                </motion.span>
              )}
            </div>
            <p className="text-label mb-1">Total Tax</p>
            <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>
              <AnimatedNumber value={r.old_regime.total_tax} format={(n) => formatINR(n)} />
            </p>
            <p className="text-[10px] mt-2" style={{ color: "var(--color-ink-muted)" }}>
              Taxable: <span className="font-mono">{formatINR(r.old_regime.taxable_income)}</span>
            </p>
          </motion.div>
        </Reveal>

        {/* New regime card */}
        <Reveal delay={0.15}>
          <motion.div
            whileHover={{ y: -4 }}
            className="bento bento-light p-5 w-full h-full relative"
            style={r.recommended_regime === "new" ? { borderColor: "var(--color-forest)", borderWidth: "2px" } : {}}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>New Regime</span>
              {r.recommended_regime === "new" && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
                  className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}
                >
                  <Check className="h-2.5 w-2.5" />Best
                </motion.span>
              )}
            </div>
            <p className="text-label mb-1">Total Tax</p>
            <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>
              <AnimatedNumber value={r.new_regime.total_tax} format={(n) => formatINR(n)} />
            </p>
            <p className="text-[10px] mt-2" style={{ color: "var(--color-ink-muted)" }}>
              Taxable: <span className="font-mono">{formatINR(r.new_regime.taxable_income)}</span>
            </p>
          </motion.div>
        </Reveal>

        {/* Savings callout — gold card (2x1) */}
        <Reveal delay={0.2} className="col-span-2">
          <motion.div whileHover={{ y: -4 }} className="bento bento-gold p-6 w-full h-full flex items-center gap-5 relative shine">
            <motion.div
              className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(250,247,242,0.18)", border: "1px solid rgba(250,247,242,0.3)" }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrendingDown className="h-6 w-6" style={{ color: "var(--color-cream)" }} />
            </motion.div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold mb-1">
                With {r.recommended_regime} regime you save
              </p>
              <p className="text-3xl font-mono font-bold">
                <AnimatedNumber value={r.savings_amount} format={(n) => formatINR(n)} />
              </p>
            </div>
            <p className="text-[10px] opacity-70 text-right max-w-[120px] leading-relaxed">
              Auto-optimized across old & new slabs
            </p>
          </motion.div>
        </Reveal>
      </div>

      {/* Income Summary + Missing Docs */}
      <div className="grid md:grid-cols-2 gap-4">
        <Reveal delay={0.25}>
          <motion.div whileHover={{ y: -4 }} className="bento bento-light p-6 w-full h-full">
            <p className="text-caption mb-4">Income Summary</p>
            <div className="space-y-3">
              {Object.entries(data.income_summary).map(([k, v]: any, i) => {
                const pct = totalIncome > 0 ? (Number(v || 0) / totalIncome) * 100 : 0;
                return (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                  >
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="capitalize" style={{ color: "var(--color-ink-soft)" }}>{k.replace(/_/g, " ")}</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{formatINR(v)}</span>
                    </div>
                    <LiquidProgress
                      value={pct}
                      height={4}
                      color={i === 0 ? "linear-gradient(90deg, #0d3b2e, #1a5c47)" : i === 1 ? "linear-gradient(90deg, #4a7c59, #6fa37e)" : "linear-gradient(90deg, #d4a017, #e8c14a)"}
                      trackColor="rgba(13,59,46,0.06)"
                      showShimmer={false}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </Reveal>

        {data.missing_documents.length > 0 && (
          <Reveal delay={0.3}>
            <motion.div whileHover={{ y: -4 }} className="bento bento-light p-6 w-full h-full" style={{ borderLeft: "3px solid var(--color-clay)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(198,93,58,0.08)" }}>
                  <FileWarning className="h-4 w-4" style={{ color: "var(--color-clay)" }} />
                </div>
                <p className="text-caption">Missing Documents</p>
              </div>
              <div className="space-y-3">
                {data.missing_documents.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-start gap-2.5"
                  >
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      className="text-[9px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 flex-shrink-0"
                      style={{
                        background: m.severity === "high" ? "rgba(198,93,58,0.1)" : "rgba(212,160,23,0.1)",
                        color: m.severity === "high" ? "var(--color-clay)" : "var(--color-gold)"
                      }}
                    >
                      {m.severity}
                    </motion.span>
                    <span className="text-sm" style={{ color: "var(--color-ink-soft)" }}>{m.reason}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Reveal>
        )}

        {data.missing_documents.length === 0 && (
          <Reveal delay={0.3}>
            <motion.div whileHover={{ y: -4 }} className="bento bento-warm p-6 w-full h-full" style={{ borderLeft: "3px solid var(--color-moss)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(74,124,89,0.1)" }}>
                  <Info className="h-4 w-4" style={{ color: "var(--color-moss)" }} />
                </div>
                <p className="text-caption">All Documents Captured</p>
              </div>
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
                Your tax profile is complete. No missing documents detected. You're ready to file with confidence.
              </p>
            </motion.div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
