"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { finance } from "@/lib/api";
import { formatINR, formatPercent } from "@/lib/format";
import type { FinanceSummary } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
const PIE_COLORS = ["#10b981", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];
export default function FinanceContent() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emergencyFund, setEmergencyFund] = useState("300000");
  useEffect(() => { finance.summary(Number(emergencyFund)).then((d) => { setData(d); setError(""); }).catch(() => setError("Failed to load")).finally(() => setLoading(false)); }, [emergencyFund]);
  if (loading) return <Skeleton className="h-96" />;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data) return null;
  const ie = [{ name: "Income", amount: data.monthly_income }, { name: "Expenses", amount: data.monthly_expenses }];
  const cats = data.top_categories.map((c) => ({ name: c.category, value: c.amount }));
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Health</h1><p className="text-sm text-slate-400 mt-0.5">{new Date(data.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p></div>
        <div className="flex items-center gap-2"><label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Emergency Fund</label><input type="number" value={emergencyFund} onChange={(e) => setEmergencyFund(e.target.value)} className="w-32 h-9 rounded-lg border border-slate-200 bg-white/50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" /></div>
      </div>
      <div className="glass rounded-2xl p-6 relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${data.score}%`, transition: "width 800ms" }} />
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Health Score</span><div className={`text-5xl font-bold tracking-tight animate-count ${data.score >= 70 ? "text-emerald-600" : "text-amber-500"}`}>{data.score}<span className="text-xl text-slate-300">/100</span></div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-right">
            <div><p className="text-[10px] text-slate-400 uppercase">Savings</p><p className="text-lg font-bold text-slate-900">{formatPercent(data.metrics.savings_rate_pct)}</p></div>
            <div><p className="text-[10px] text-slate-400 uppercase">D/I Ratio</p><p className="text-lg font-bold text-slate-900">{formatPercent(data.metrics.debt_to_income_pct)}</p></div>
            <div><p className="text-[10px] text-slate-400 uppercase">Emergency</p><p className="text-lg font-bold text-slate-900">{data.metrics.emergency_fund_months.toFixed(1)}mo</p></div>
            <div><p className="text-[10px] text-slate-400 uppercase">Subs</p><p className="text-lg font-bold text-slate-900">{formatINR(data.metrics.subscription_total)}</p></div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6 animate-slide-up stagger-1">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income vs Expenses</span>
          <ResponsiveContainer width="100%" height={220}><BarChart data={ie} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} /><Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} /><Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-6 animate-slide-up stagger-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Spending by Category</span>
          {cats.length === 0 ? <p className="text-sm text-slate-400 py-16 text-center">No expense data.</p> : <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={cats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>{cats.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer>}
        </div>
      </div>
      {data.suggestions.length > 0 && <div className="glass rounded-2xl p-5 animate-slide-up stagger-3 border-l-4 border-emerald-400"><span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Suggestions</span><div className="mt-2 space-y-2">{data.suggestions.map((s, i) => <p key={i} className="text-sm text-slate-700">• {s}</p>)}</div></div>}
    </div>
  );
}
