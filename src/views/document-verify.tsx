"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNav } from "@/lib/nav-context";
import { ArrowLeft, Check, CheckCheck, Edit3, ShieldCheck, Sparkles } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { LiquidProgress } from "@/components/motion/liquid-progress";
const { useToast } = require("@/hooks/use-toast");

interface Field { id: string; field_name: string; field_value: string; confidence_score: number; verified_by_user: boolean; source_snippet: string | null; }

export default function DocumentVerifyContent() {
  const { params, navigate } = useNav();
  const docId = params.id as string;
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!docId) return;
    const t = localStorage.getItem("finsight_token");
    fetch(`/api/extraction/${docId}/fields`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => setFields(d.items || []))
      .finally(() => setLoading(false));
  }, [docId]);

  const verify = async (id: string) => {
    const t = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/extraction/${docId}/fields/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({}) });
      setFields(fs => fs.map(f => f.id === id ? { ...f, verified_by_user: true, confidence_score: 1.0 } : f));
      toast({ title: "Verified!" });
    } catch {}
  };

  const verifyAll = async () => {
    const t = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/extraction/${docId}/verify-all`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      setFields(fs => fs.map(f => ({ ...f, verified_by_user: true, confidence_score: 1.0 })));
      toast({ title: "All fields verified!" });
    } catch {}
  };

  const edit = async (id: string) => {
    const t = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/extraction/${docId}/fields/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ value: editValue }) });
      setFields(fs => fs.map(f => f.id === id ? { ...f, field_value: editValue, verified_by_user: true, confidence_score: 1.0 } : f));
      setEditingId(null);
      toast({ title: "Updated & verified!" });
    } catch {}
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-96 rounded-[20px]" />
    </div>
  );

  const verifiedCount = fields.filter(f => f.verified_by_user).length;
  const avgConfidence = fields.length > 0 ? fields.reduce((a, f) => a + f.confidence_score, 0) / fields.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("documents")}
            className="p-2 rounded-lg"
            style={{ background: "rgba(26,26,26,0.04)", color: "var(--color-ink-soft)" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <div>
            <p className="text-caption mb-2 flex items-center gap-2">
              <span className="dot dot-live" style={{ background: "var(--color-gold)" }} />Review
            </p>
            <h1 className="text-heading">Verify Extracted Fields</h1>
          </div>
        </div>
      </Reveal>

      {fields.length === 0 ? (
        <Reveal>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bento bento-light p-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(26,26,26,0.06)" }}
            >
              <Sparkles className="h-7 w-7" style={{ color: "var(--color-ink-muted)" }} />
            </motion.div>
            <p className="text-lg font-semibold" style={{ color: "var(--color-ink)" }}>No fields extracted</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-ink-muted)" }}>This document may not contain recognizable financial data.</p>
          </motion.div>
        </Reveal>
      ) : (
        <>
          {/* Summary bar */}
          <Reveal delay={0.05}>
            <motion.div
              whileHover={{ y: -3 }}
              className="bento bento-dark p-5 relative overflow-hidden"
            >
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(217,119,6,0.25) 0%, transparent 60%)" }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Verified</p>
                    <p className="text-2xl font-mono font-bold">
                      <span style={{ color: "var(--color-gold-light)" }}>{verifiedCount}</span>
                      <span className="opacity-50">/{fields.length}</span>
                    </p>
                  </div>
                  <div className="h-12 w-px" style={{ background: "rgba(250,247,242,0.1)" }} />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Avg Confidence</p>
                    <p className="text-2xl font-mono font-bold" style={{ color: "var(--color-gold-light)" }}>
                      {Math.round(avgConfidence * 100)}%
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={verifyAll}
                  className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #d97706, #b45309)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(217,119,6,0.4)" }}
                >
                  <CheckCheck className="h-4 w-4" />Verify All
                </motion.button>
              </div>
            </motion.div>
          </Reveal>

          {/* Field list */}
          <Reveal delay={0.1}>
            <motion.div whileHover={{ y: -3 }} className="bento bento-light overflow-hidden">
              {fields.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 p-5 transition-colors hover:bg-[rgba(26,26,26,0.02)]"
                  style={i !== fields.length - 1 ? { borderBottom: "1px solid var(--color-line-soft)" } : {}}
                >
                  <div className="w-40 flex-shrink-0">
                    <p className="text-sm font-semibold capitalize" style={{ color: "var(--color-ink)" }}>
                      {f.field_name.replace(/_/g, " ")}
                    </p>
                    <motion.span
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mt-1.5"
                      style={{
                        background: f.confidence_score >= 0.9 ? "rgba(107,98,88,0.1)" : f.confidence_score >= 0.7 ? "rgba(217,119,6,0.1)" : "rgba(185,28,28,0.1)",
                        color: f.confidence_score >= 0.9 ? "var(--color-moss)" : f.confidence_score >= 0.7 ? "var(--color-gold)" : "var(--color-clay)",
                      }}
                    >
                      <span className="dot" style={{ background: "currentColor" }} />
                      {Math.round(f.confidence_score * 100)}% confidence
                    </motion.span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                      {editingId === f.id ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="flex gap-2"
                        >
                          <input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="flex-1 h-9 rounded-lg px-3 text-sm outline-none glass-input"
                            autoFocus
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => edit(f.id)}
                            className="h-9 px-3 rounded-lg text-xs font-semibold"
                            style={{ background: "linear-gradient(135deg, #1a1a1a, #0a0a0a)", color: "var(--color-cream)" }}
                          >
                            Save
                          </motion.button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="h-9 px-3 rounded-lg text-xs font-medium"
                            style={{ border: "1px solid var(--color-line)", color: "var(--color-ink-soft)" }}
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <p className="text-sm font-mono" style={{ color: f.verified_by_user ? "var(--color-forest)" : "var(--color-ink)" }}>
                            {f.field_value}
                          </p>
                          {f.source_snippet && !f.verified_by_user && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="text-xs mt-1.5 italic truncate"
                              style={{ color: "var(--color-ink-muted)" }}
                            >
                              Source: "{f.source_snippet}"
                            </motion.p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {f.verified_by_user ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(107,98,88,0.1)", color: "var(--color-moss)" }}
                      >
                        <ShieldCheck className="h-3 w-3" />Verified
                      </motion.span>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setEditingId(f.id); setEditValue(f.field_value); }}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: "var(--color-ink-muted)", background: "rgba(26,26,26,0.04)" }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => verify(f.id)}
                          className="h-9 px-3 rounded-lg text-xs font-semibold"
                          style={{ border: "1px solid var(--color-line)", color: "var(--color-ink-soft)" }}
                        >
                          Verify
                        </motion.button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        </>
      )}
    </div>
  );
}
