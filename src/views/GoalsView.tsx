"use client";
import { useState, useEffect } from "react";
import { Target, Plus, Trash2, TrendingUp } from "lucide-react";
import { KineticNumber } from "@/components/ui/KineticNumber";
import { motion, AnimatePresence } from "motion/react";

interface Goal { id: string; goalName: string; targetAmount: number; currentAmount: number; monthlyContribution: number; targetDate: string | null; projection?: { projected_completion_date?: string; shortfall?: number }; }

export default function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ goalName: "", targetAmount: "", monthlyContribution: "", targetDate: "" });

  const load = () => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    fetch("/api/goals", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setGoals(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("finsight_token");
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          goal_name: form.goalName,
          target_amount: Number(form.targetAmount),
          monthly_contribution: Number(form.monthlyContribution || 0),
          target_date: form.targetDate || undefined,
          expected_return_rate: 0.04,
        }),
      });
      setForm({ goalName: "", targetAmount: "", monthlyContribution: "", targetDate: "" });
      setIsFormOpen(false);
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {}
  };

  if (loading) return (
    <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
      <div className="skeleton h-16 w-64 mb-8" />
      <div className="grid md:grid-cols-2 gap-6"><div className="skeleton h-48" /><div className="skeleton h-48" /></div>
    </div>
  );

  return (
    <div className="flex flex-col px-6 lg:px-12 max-w-[1200px] mx-auto w-full">
      <div className="pt-8 pb-6 border-b border-carbon/10 mb-12 flex justify-between items-end">
        <div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Simulations & Planning</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon">Goal Simulations</h1>
        </div>
        <button onClick={() => setIsFormOpen(!isFormOpen)} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-carbon text-white text-xs font-bold uppercase tracking-wider hover:bg-carbon/90 transition-colors">
          {isFormOpen ? "Cancel" : "New Goal"} <Plus className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form onSubmit={handleCreate} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-12">
            <div className="p-8 bg-[#FAFAFA] border border-carbon/10 space-y-4">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Create New Goal</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input type="text" value={form.goalName} onChange={e => setForm({ ...form, goalName: e.target.value })} placeholder="Goal Name (e.g. House Down Payment)" required className="px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 text-sm" />
                <input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="Target Amount (₹)" required className="px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 text-sm" />
                <input type="number" value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} placeholder="Monthly SIP (₹)" className="px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 text-sm" />
                <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 text-sm" />
              </div>
              <button type="submit" className="px-6 py-2.5 bg-carbon text-white text-xs font-bold uppercase tracking-wider">Initialize Goal</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="w-12 h-12 text-stone-light mb-6" />
          <h2 className="text-xl font-medium text-carbon mb-2">No Goals Yet</h2>
          <p className="text-sm text-stone max-w-md mb-8">Create your first financial goal to start planning for the future.</p>
          <button onClick={() => setIsFormOpen(true)} className="px-6 py-3 bg-carbon text-white text-xs font-bold uppercase tracking-wider hover:bg-carbon/90 transition-colors">Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((g, i) => {
            const pct = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-8 border border-carbon/10 bg-[#FAFAFA]">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-carbon/5 flex items-center justify-center"><Target className="w-5 h-5 text-carbon" /></div>
                    <div><h4 className="text-sm font-medium text-carbon">{g.goalName}</h4><p className="text-xs text-stone">Target: ₹{g.targetAmount.toLocaleString("en-IN")}</p></div>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="p-2 text-stone hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-3xl font-light text-carbon"><KineticNumber value={pct} format={(v) => v.toFixed(0)} /></span>
                  <span className="text-sm text-stone">% complete</span>
                </div>
                <div className="relative h-1.5 bg-carbon/10 rounded-full overflow-hidden mb-4">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="absolute top-0 left-0 h-full bg-saffron" />
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-carbon/5">
                  <div><span className="block text-[10px] text-stone uppercase tracking-wider mb-1">Saved</span><span className="font-mono text-sm text-carbon">₹{g.currentAmount.toLocaleString("en-IN")}</span></div>
                  <div><span className="block text-[10px] text-stone uppercase tracking-wider mb-1">Monthly</span><span className="font-mono text-sm text-carbon">₹{g.monthlyContribution.toLocaleString("en-IN")}</span></div>
                  <div><span className="block text-[10px] text-stone uppercase tracking-wider mb-1">ETA</span><span className="font-mono text-sm text-carbon">{g.projection?.projected_completion_date ? new Date(g.projection.projected_completion_date).toLocaleDateString("en-IN", { year: "numeric", month: "short" }) : "—"}</span></div>
                </div>
                {g.projection?.shortfall && g.projection.shortfall > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-700">Shortfall: ₹{g.projection.shortfall.toLocaleString("en-IN")}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
