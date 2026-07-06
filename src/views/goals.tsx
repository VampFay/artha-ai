"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { goals as goalsApi } from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import type { Goal } from "@/lib/api";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { LiquidProgress } from "@/components/motion/liquid-progress";
import { Sparkline } from "@/components/motion/sparkline";
import { Plus, Target, Trash2, TrendingUp, Calendar, IndianRupee, X } from "lucide-react";
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalsApi.create({
        goal_name: form.goal_name,
        target_amount: Number(form.target_amount),
        monthly_contribution: Number(form.monthly_contribution || 0),
        target_date: form.target_date || undefined,
        expected_return_rate: 0.04,
      });
      toast({ title: "Goal created!" });
      setShowForm(false);
      setForm({ goal_name: "", target_amount: "", monthly_contribution: "", target_date: "" });
      load();
    } catch (err: any) { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try {
      const t = localStorage.getItem("finsight_token");
      await fetch(`/api/goals/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
      toast({ title: "Goal deleted." });
      load();
    } catch {}
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="skeleton rounded-[20px] h-48" />
        <div className="skeleton rounded-[20px] h-48" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="text-caption mb-2 flex items-center gap-2">
              <span className="dot dot-live" style={{ background: "var(--color-gold)" }} />Planning
            </p>
            <h1 className="text-heading">Goals</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Goal"}
          </motion.button>
        </div>
      </Reveal>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bento bento-light p-3 text-sm" style={{ color: "var(--color-clay)", borderLeft: "3px solid var(--color-clay)" }}>
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreate} className="bento bento-light p-6 space-y-4">
              <p className="text-caption">Create New Goal</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  ["Goal Name", "goal_name", "text", "House Down Payment"],
                  ["Target (₹)", "target_amount", "number", "1500000"],
                  ["Monthly (₹)", "monthly_contribution", "number", "25000"],
                  ["Target Date", "target_date", "date", ""],
                ].map(([label, key, type, ph]: any) => (
                  <div key={key}>
                    <label className="text-label mb-1.5 block">{label}</label>
                    <input
                      type={type}
                      value={(form as any)[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={ph}
                      required={key !== "monthly_contribution" && key !== "target_date"}
                      className="w-full h-11 rounded-xl px-3.5 text-sm outline-none glass-input"
                    />
                  </div>
                ))}
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-11 px-5 rounded-xl text-sm font-semibold flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)" }}
              >
                <Plus className="h-4 w-4" />Create Goal
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <Reveal>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bento bento-light p-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, rgba(13,59,46,0.08), rgba(212,160,23,0.08))" }}
            >
              <Target className="h-7 w-7" style={{ color: "var(--color-forest)" }} />
            </motion.div>
            <p className="text-lg font-semibold" style={{ color: "var(--color-ink)" }}>No goals yet</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "var(--color-ink-muted)" }}>Create a goal to start planning your financial future.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="h-10 px-5 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)" }}
            >
              Create your first goal
            </motion.button>
          </motion.div>
        </Reveal>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map((g, i) => {
            const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
            // Mock projection trend (current → projected)
            const proj = Array.from({ length: 12 }, (_, idx) => {
              const base = g.current_amount;
              const monthly = g.monthly_contribution || (g.target_amount / 60);
              return base + monthly * idx * (1 + 0.04 * idx / 12);
            });
            return (
              <Reveal key={g.id} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bento bento-light p-6 w-full h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        className="h-11 w-11 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(13,59,46,0.08), rgba(212,160,23,0.08))" }}
                      >
                        <Target className="h-5 w-5" style={{ color: "var(--color-forest)" }} />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>{g.goal_name}</h3>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                          <IndianRupee className="h-3 w-3" />{formatINR(g.target_amount)} target
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-mono font-bold" style={{ color: "var(--color-forest)" }}>
                        <AnimatedNumber value={pct} format={(n) => n.toFixed(0)} />%
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1, color: "var(--color-clay)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--color-ink-muted)" }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  <LiquidProgress
                    value={pct}
                    height={10}
                    color="linear-gradient(90deg, #0d3b2e 0%, #4a7c59 60%, #d4a017 100%)"
                    trackColor="rgba(13,59,46,0.06)"
                    duration={1400}
                  />

                  <div className="flex justify-between text-xs mt-3" style={{ color: "var(--color-ink-muted)" }}>
                    <span className="font-mono font-semibold" style={{ color: "var(--color-ink-soft)" }}>{formatINR(g.current_amount)} saved</span>
                    {g.projection?.projected_completion_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{formatDate(g.projection.projected_completion_date)}
                      </span>
                    )}
                  </div>

                  {/* Projection sparkline */}
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-line-soft)" }}>
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--color-ink-muted)" }}>12-month projection</p>
                    <Sparkline data={proj} width={300} height={40} color="#0d3b2e" />
                  </div>

                  {g.projection?.shortfall > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-3 text-xs flex items-center gap-1.5 p-2 rounded-lg"
                      style={{ color: "var(--color-clay)", background: "rgba(198,93,58,0.06)" }}
                    >
                      <TrendingUp className="h-3 w-3" />Shortfall: <span className="font-mono font-semibold">{formatINR(g.projection.shortfall)}</span>
                    </motion.div>
                  )}
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
