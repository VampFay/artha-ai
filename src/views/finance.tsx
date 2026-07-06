"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { finance } from "@/lib/api";
import { formatINR, formatPercent } from "@/lib/format";
import type { FinanceSummary } from "@/lib/api";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { ProgressRing } from "@/components/motion/progress-ring";
import { LiquidProgress } from "@/components/motion/liquid-progress";
import { GradientBars } from "@/components/motion/gradient-bars";
import { Sparkline } from "@/components/motion/sparkline";
import { TrendingUp, TrendingDown, Sparkles, Wallet, CreditCard, PiggyBank, Bell } from "lucide-react";

const DONUT_COLORS = ["#1a1a1a", "#2e2e2e", "#6b6258", "#d97706", "#f59e0b", "#b91c1c", "#8a8a8a", "#4a4a4a"];

export default function FinanceContent() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [ef, setEf] = useState("300000");

  useEffect(() => { finance.summary(Number(ef)).then(setData).finally(() => setLoading(false)); }, [ef]);

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 row-span-2 skeleton rounded-[20px] h-72" />
        {Array.from({length: 4}).map((_,i) => <div key={i} className="skeleton rounded-[20px] h-32" />)}
      </div>
    </div>
  );
  if (!data) return null;

  const cats = data.top_categories.map(c => ({ label: c.category, value: c.amount }));
  const savingsTrend = [22, 26, 24, 28, 31, data.metrics.savings_rate_pct];

  const metrics = [
    { label: "Savings", value: formatPercent(data.metrics.savings_rate_pct), icon: PiggyBank, color: "var(--color-forest)", trend: [10, 14, 12, 18, 22, 26] },
    { label: "D/I Ratio", value: formatPercent(data.metrics.debt_to_income_pct), icon: CreditCard, color: "var(--color-clay)", trend: [38, 36, 34, 32, 30, 28] },
    { label: "Emergency", value: `${data.metrics.emergency_fund_months.toFixed(1)}mo`, icon: Wallet, color: "var(--color-gold)", trend: [2, 2.5, 3, 3.5, 4, 4.5] },
    { label: "Subs", value: formatINR(data.metrics.subscription_total), icon: Bell, color: "var(--color-ink)", trend: [1200, 1200, 1100, 1100, 1000, 900] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex justify-between items-end flex-wrap gap-4">
          <div>
            <p className="text-caption mb-2 flex items-center gap-2">
              <span className="dot dot-live" style={{ background: "var(--color-moss)" }} />
              {new Date(data.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </p>
            <h1 className="text-heading">Financial Health</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-label">Emergency Fund</label>
            <motion.input
              type="number"
              value={ef}
              onChange={e => setEf(e.target.value)}
              whileFocus={{ scale: 1.02 }}
              className="w-32 h-10 rounded-xl px-3 text-sm font-mono outline-none glass-input"
            />
          </div>
        </div>
      </Reveal>

      {/* Bento Grid — Score + 4 metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

        {/* Hero — score ring + metrics */}
        <Reveal delay={0.05} className="col-span-2 row-span-2">
          <motion.div whileHover={{ y: -4 }} className="bento bento-dark p-7 w-full h-full relative overflow-hidden">
            <motion.div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(217,119,6,0.25) 0%, transparent 60%)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-3">Health Score</p>
              <div className="flex items-center gap-6 mb-5">
                <ProgressRing
                  value={data.score}
                  size={140}
                  strokeWidth={10}
                  color="#d97706"
                  trackColor="rgba(250,247,242,0.08)"
                  label={<AnimatedNumber value={data.score} />}
                  sublabel="/ 100"
                />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Status</p>
                  <p className="text-xl font-bold mb-3" style={{ color: data.score >= 70 ? "var(--color-gold-light)" : "var(--color-clay-soft)" }}>
                    {data.score >= 80 ? "Excellent" : data.score >= 60 ? "Good" : data.score >= 40 ? "Fair" : "Needs Attention"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">6-month Trend</p>
                  <Sparkline data={savingsTrend} width={130} height={32} color="#f59e0b" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-5" style={{ borderTop: "1px solid rgba(250,247,242,0.08)" }}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider opacity-50">Savings Rate</p>
                  <p className="text-sm font-mono font-semibold mt-0.5">{formatPercent(data.metrics.savings_rate_pct)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider opacity-50">Emergency Fund</p>
                  <p className="text-sm font-mono font-semibold mt-0.5">{data.metrics.emergency_fund_months.toFixed(1)} mo</p>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>

        {/* 4 metric mini cards */}
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.label} delay={0.1 + i * 0.05}>
              <motion.div whileHover={{ y: -4 }} className="bento bento-light p-5 w-full h-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-label">{m.label}</p>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${m.color === "var(--color-forest)" ? "rgba(26,26,26,0.06)" : m.color === "var(--color-clay)" ? "rgba(185,28,28,0.08)" : m.color === "var(--color-gold)" ? "rgba(217,119,6,0.1)" : "rgba(0,0,0,0.04)"}` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                  </div>
                </div>
                <p className="text-xl font-mono font-bold" style={{ color: m.color }}>
                  <AnimatedNumber
                    value={m.label === "Savings" || m.label === "D/I Ratio" ? parseFloat(m.value) : m.label === "Emergency" ? parseFloat(m.value) : parseFloat(m.value.replace(/[^0-9.]/g, "")) || 0}
                    format={() => m.value}
                  />
                </p>
                <div className="mt-2">
                  <Sparkline data={m.trend} width={130} height={24} color={m.color === "var(--color-forest)" ? "#1a1a1a" : m.color === "var(--color-clay)" ? "#b91c1c" : m.color === "var(--color-gold)" ? "#d97706" : "#4a4a4a"} />
                </div>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      {/* Income vs Expenses + Donut */}
      <div className="grid md:grid-cols-2 gap-4">
        <Reveal delay={0.25}>
          <motion.div whileHover={{ y: -4 }} className="bento bento-light p-6 w-full h-full">
            <div className="flex items-center justify-between mb-5">
              <p className="text-caption">Income vs Expenses</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(107,98,88,0.1)", color: "var(--color-moss)" }}>
                Net +{formatINR(data.monthly_income - data.monthly_expenses)}
              </span>
            </div>
            <GradientBars
              data={[
                { label: "Income", value: data.monthly_income, color: "#1a1a1a" },
                { label: "Expenses", value: data.monthly_expenses, color: "#b91c1c" },
              ]}
              orientation="vertical"
              height={180}
              formatValue={(n) => `₹${(n/1000).toFixed(0)}k`}
              formatLabel={(s) => s}
            />
          </motion.div>
        </Reveal>

        <Reveal delay={0.3}>
          <motion.div whileHover={{ y: -4 }} className="bento bento-light p-6 w-full h-full">
            <p className="text-caption mb-4">Spending by Category</p>
            {cats.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No expense data.</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Upload a bank statement to see breakdown.</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <AnimatedDonut data={cats} />
                <div className="flex-1 space-y-2">
                  {cats.slice(0, 5).map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="flex-1 truncate" style={{ color: "var(--color-ink-soft)" }}>{c.label}</span>
                      <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{formatINR(c.value)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </Reveal>
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <Reveal delay={0.35}>
          <motion.div whileHover={{ y: -4 }} className="bento bento-warm p-6 w-full" style={{ borderLeft: "3px solid var(--color-gold)" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(217,119,6,0.1)" }}>
                <Sparkles className="h-4 w-4" style={{ color: "var(--color-gold)" }} />
              </div>
              <p className="text-caption">Suggestions</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {data.suggestions.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-2 text-sm p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: "var(--color-gold)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ color: "var(--color-ink-soft)" }}>{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Reveal>
      )}
    </div>
  );
}

/** Animated donut chart — pure SVG with stroke-dashoffset reveal. */
function AnimatedDonut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={130} height={130} viewBox="0 0 130 130" className="-rotate-90 flex-shrink-0">
      <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(26,26,26,0.06)" strokeWidth={14} />
      {data.map((d, i) => {
        const pct = d.value / total;
        const dash = pct * circ;
        const seg = (
          <motion.circle
            key={i}
            cx={65} cy={65} r={radius} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          />
        );
        offset += dash;
        return seg;
      })}
      <text x="65" y="60" textAnchor="middle" className="rotate-90" style={{ transformOrigin: "65px 65px", fill: "var(--color-ink)", fontSize: 11, fontWeight: 700 }} >
        Total
      </text>
      <text x="65" y="76" textAnchor="middle" className="rotate-90" style={{ transformOrigin: "65px 65px", fill: "var(--color-forest)", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-mono)" }} >
        ₹{(total/1000).toFixed(0)}k
      </text>
    </svg>
  );
}
