"use client";
import { useEffect, useState } from "react";
import { finance } from "@/lib/api";
import { formatINR, formatPercent } from "@/lib/format";
import type { FinanceSummary } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
const PIE_COLORS = ["#0d3b2e", "#4a7c59", "#d4a017", "#c65d3a", "#1a5c47", "#e8c14a", "#8a8a8a", "#4a4a4a"];

export default function FinanceContent() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [ef, setEf] = useState("300000");
  useEffect(() => { finance.summary(Number(ef)).then(setData).finally(() => setLoading(false)); }, [ef]);
  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return null;
  const ie = [{ name: "Income", amount: data.monthly_income }, { name: "Expenses", amount: data.monthly_expenses }];
  const cats = data.top_categories.map(c => ({ name: c.category, value: c.amount }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4 animate-slide-up">
        <div><p className="text-caption mb-1">{new Date(data.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p><h1 className="text-heading">Financial Health</h1></div>
        <div className="flex items-center gap-2"><label className="text-label">Emergency Fund</label><input type="number" value={ef} onChange={e => setEf(e.target.value)} className="w-28 h-9 rounded-lg border px-3 text-sm font-mono outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={e => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={e => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} /></div>
      </div>

      {/* Bento: Score (dark) + 4 metric chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 row-span-2 bento bento-dark p-7 animate-slide-up stagger-1 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5" style={{ background: "var(--color-gold)" }} />
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Health Score</p>
          <div className="flex items-baseline gap-1.5"><span className="text-display font-mono animate-count">{data.score}</span><span className="text-lg opacity-40">/100</span></div>
          <div className="my-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(250,247,242,0.1)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${data.score}%`, background: "var(--color-gold)" }} /></div>
          <div className="grid grid-cols-2 gap-4 mt-5">
            {[["Savings Rate", formatPercent(data.metrics.savings_rate_pct)], ["D/I Ratio", formatPercent(data.metrics.debt_to_income_pct)], ["Emergency Fund", `${data.metrics.emergency_fund_months.toFixed(1)} mo`], ["Subscriptions", formatINR(data.metrics.subscription_total)]].map(([label, val]) => (
              <div key={label}><p className="text-[9px] uppercase tracking-wider opacity-50">{label}</p><p className="text-sm font-mono font-semibold mt-0.5">{val}</p></div>
            ))}
          </div>
        </div>
        {/* Mini metric cards */}
        {[["Savings", formatPercent(data.metrics.savings_rate_pct), "var(--color-forest)"], ["D/I Ratio", formatPercent(data.metrics.debt_to_income_pct), "var(--color-clay)"], ["Emergency", `${data.metrics.emergency_fund_months.toFixed(1)}mo`, "var(--color-gold)"], ["Subs", formatINR(data.metrics.subscription_total), "var(--color-ink)"]].map(([label, val, color]: any, i) => (
          <div key={label} className={`bento bento-light p-4 animate-slide-up stagger-${i + 2}`}>
            <p className="text-label mb-1">{label}</p><p className="text-lg font-mono font-bold animate-count" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bento bento-light p-6 animate-slide-up stagger-1">
          <p className="text-caption mb-4">Income vs Expenses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ie} margin={{ top: 5, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8a8a8a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#8a8a8a" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip formatter={v => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e8e2d6", fontSize: 12, background: "#fff" }} cursor={{ fill: "rgba(13,59,46,0.03)" }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} animationDuration={1000} animationEasing="ease-out">
                {ie.map((_, i) => <Cell key={i} fill={i === 0 ? "#0d3b2e" : "#c65d3a"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bento bento-light p-6 animate-slide-up stagger-2">
          <p className="text-caption mb-4">Spending by Category</p>
          {cats.length === 0 ? <p className="text-sm py-12 text-center" style={{ color: "var(--color-ink-muted)" }}>No expense data.</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} animationDuration={800} animationEasing="ease-out">
                  {cats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e8e2d6", fontSize: 12, background: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="bento bento-warm p-5 animate-slide-up stagger-3" style={{ borderLeft: "3px solid var(--color-gold)" }}>
          <p className="text-caption mb-3">Suggestions</p>
          <div className="space-y-2">{data.suggestions.map((s, i) => <p key={i} className="text-sm" style={{ color: "var(--color-ink-soft)" }}>• {s}</p>)}</div>
        </div>
      )}
    </div>
  );
}
