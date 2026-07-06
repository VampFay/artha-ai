"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatDateTime } from "@/lib/format";
import { FileText, TrendingUp, Target, Download, Loader2, Check, FileCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
const { useToast } = require("@/hooks/use-toast");

export default function ReportsContent() {
  const [reports, setReports] = useState<{ id: string; report_type: string; generated_at: string }[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async (type: string) => {
    setGenerating(type);
    try {
      const res = await fetch(`/api/reports?type=${type}`, { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${type}_report.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF generated!" });
      setReports(r => [{ id: `r_${Date.now()}`, report_type: type, generated_at: new Date().toISOString() }, ...r]);
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setGenerating(null); }
  };

  const types = [
    { type: "tax_summary", icon: FileText, title: "Tax Summary", desc: "Income, deductions, regime comparison, missing documents.", color: "#1a1a1a", accent: "rgba(26,26,26,0.08)" },
    { type: "finance_health", icon: TrendingUp, title: "Financial Health", desc: "Score, metrics, top categories, suggestions.", color: "#d97706", accent: "rgba(217,119,6,0.1)" },
    { type: "goal_simulation", icon: Target, title: "Goal Simulation", desc: "Projection, shortfall, multi-scenario comparison.", color: "#6b6258", accent: "rgba(107,98,88,0.1)" },
  ];
  const lastGen = (t: string) => reports.find(r => r.report_type === t);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-caption mb-2 flex items-center gap-2">
            <span className="dot dot-live" style={{ background: "var(--color-forest)" }} />Export
          </p>
          <h1 className="text-heading">Reports</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>Generate CA-ready PDF reports from your verified data.</p>
        </div>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-4">
        {types.map((r, i) => {
          const Icon = r.icon;
          const last = lastGen(r.type);
          const isGenerating = generating === r.type;
          return (
            <Reveal key={r.type} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -6 }}
                className="bento bento-light p-6 w-full h-full relative overflow-hidden group"
              >
                <motion.div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${r.accent} 0%, transparent 70%)` }}
                />
                <div className="relative">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: r.accent }}
                  >
                    <Icon className="h-6 w-6" style={{ color: r.color }} />
                  </motion.div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: "var(--color-ink)" }}>{r.title}</h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>{r.desc}</p>

                  <div className="mb-4">
                    {last ? (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--color-moss)" }}
                      >
                        <Check className="h-3 w-3" />{formatDateTime(last.generated_at)}
                      </motion.div>
                    ) : (
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-ink-muted)" }}>Not generated</p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerate(r.type)}
                    disabled={isGenerating}
                    className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(26,26,26,0.4)" }}
                  >
                    <span className="absolute inset-0 shine" />
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><Download className="h-4 w-4" />Generate PDF</>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </Reveal>
          );
        })}
      </div>

      {/* Recent reports list */}
      {reports.length > 0 && (
        <Reveal delay={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento bento-warm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
              <p className="text-caption">Recent Generations</p>
            </div>
            <div className="space-y-2">
              {reports.slice(0, 6).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between text-sm p-3 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" style={{ color: "var(--color-forest)" }} />
                    <span className="font-medium capitalize" style={{ color: "var(--color-ink)" }}>{r.report_type.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--color-ink-muted)" }}>{formatDateTime(r.generated_at)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Reveal>
      )}
    </div>
  );
}
