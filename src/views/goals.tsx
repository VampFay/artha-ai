"use client";
import { useEffect, useState } from "react";
import { goals as goalsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import type { Goal } from "@/lib/api";
import { Plus, Target, Trash2, TrendingUp } from "lucide-react";
const { useToast } = require("@/hooks/use-toast");
export default function GoalsContent() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ goal_name: "", target_amount: "", monthly_contribution: "", target_date: "" });
  const [error, setError] = useState("");
  const { toast } = useToast();
  const load = () => { goalsApi.list().then(r => { setGoals(r.items); setError(""); }).catch(() => setError("Failed")).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); try { await goalsApi.create({ goal_name: form.goal_name, target_amount: Number(form.target_amount), monthly_contribution: Number(form.monthly_contribution || 0), target_date: form.target_date || undefined, expected_return_rate: 0.04 }); toast({ title: "Goal created!" }); setShowForm(false); setForm({ goal_name: "", target_amount: "", monthly_contribution: "", target_date: "" }); load(); } catch (err: any) { toast({ title: "Failed", variant: "destructive" }); } };
  const handleDelete = async (id: string) => { try { const t = localStorage.getItem("finsight_token"); await fetch(`/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); toast({ title: "Goal deleted." }); load(); } catch {} };
  if (loading) return <div className="skeleton h-48 rounded-2xl" />;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex justify-between items-center animate-slide-up"><div><p className="text-caption mb-1">Planning</p><h1 className="text-heading">Goals</h1></div><button onClick={() => setShowForm(!showForm)} className="h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all duration-200" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}><Plus className="h-4 w-4" />{showForm ? "Cancel" : "New Goal"}</button></div>
      {error && <div className="bento bento-light p-3 text-sm" style={{ color: "var(--color-clay)", borderLeft: "3px solid var(--color-clay)" }}>{error}</div>}
      {showForm && <form onSubmit={handleCreate} className="bento bento-light p-6 space-y-3 animate-slide-down"><div className="grid md:grid-cols-2 gap-3">{[["Goal Name","goal_name","text"],["Target (₹)","target_amount","number"],["Monthly (₹)","monthly_contribution","number"],["Target Date","target_date","date"]].map(([label, key, type]: any) => <div key={key}><label className="text-label mb-1.5 block">{label}</label><input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== "monthly_contribution" && key !== "target_date"} className="w-full h-10 rounded-lg border px-3 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={e => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={e => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} /></div>)}</div><button type="submit" className="h-10 px-5 rounded-lg text-sm font-medium" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>Create Goal</button></form>}
      {goals.length === 0 ? <div className="bento bento-light p-12 text-center"><div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(13,59,46,0.06)" }}><Target className="h-6 w-6" style={{ color: "var(--color-forest)" }} /></div><p className="text-lg font-medium" style={{ color: "var(--color-ink)" }}>No goals yet</p><p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>Create a goal to start planning.</p><button onClick={() => setShowForm(true)} className="mt-4 h-10 px-5 rounded-lg text-sm font-medium" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>Create your first goal</button></div> : 
      <div className="grid md:grid-cols-2 gap-4">{goals.map((g, i) => { const pct = Math.min(100, (g.current_amount / g.target_amount) * 100); return (
        <div key={g.id} className="bento bento-light p-6 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-2.5"><div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}><Target className="h-4 w-4" style={{ color: "var(--color-forest)" }} /></div><div><h3 className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>{g.goal_name}</h3><p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{formatINR(g.target_amount)} target</p></div></div><div className="flex items-center gap-2"><span className="text-2xl font-mono font-bold" style={{ color: "var(--color-forest)" }}>{pct.toFixed(0)}%</span><button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-ink-muted)" }} onMouseEnter={e => e.currentTarget.style.color = "var(--color-clay)"} onMouseLeave={e => e.currentTarget.style.color = "var(--color-ink-muted)"}><Trash2 className="h-4 w-4" /></button></div></div>
          <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--color-cream-dark)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--color-forest), var(--color-moss))" }} /></div>
          <div className="flex justify-between text-xs" style={{ color: "var(--color-ink-muted)" }}><span className="font-mono">{formatINR(g.current_amount)} saved</span>{g.projection?.projected_completion_date && <span>Projected: {formatDate(g.projection.projected_completion_date)}</span>}</div>
          {g.projection?.shortfall > 0 && <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--color-clay)" }}><TrendingUp className="h-3 w-3" />Shortfall: {formatINR(g.projection.shortfall)}</div>}
        </div> ); })}</div>}
    </div>
  );
}
