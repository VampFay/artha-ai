"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import { consent, audit } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Consent, AuditLogEntry } from "@/lib/api";
import { Shield, Database, ScrollText, Download, LogOut, ShieldX, User, Crown } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
const { useToast } = require("@/hooks/use-toast");

export default function SettingsContent() {
  const { user, logout } = useAuth();
  const { navigate } = useNav();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([consent.history(), audit.list()])
      .then(([c, a]) => { setConsents(c.items); setLogs(a.items); })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const t = localStorage.getItem("finsight_token");
      const res = await fetch("/api/users/me/export", { headers: { Authorization: `Bearer ${t}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "finsight_export.json"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported!" });
    } catch { toast({ title: "Failed", variant: "destructive" }); }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke consent? This will restrict document processing.")) return;
    setRevoking(true);
    try {
      const t = localStorage.getItem("finsight_token");
      await fetch("/api/consent/revoke", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      toast({ title: "Consent revoked." });
      consent.history().then(c => setConsents(c.items));
    } catch {} finally { setRevoking(false); }
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-32" />
      <div className="skeleton h-28 rounded-[20px]" />
      <div className="grid md:grid-cols-2 gap-4">
        <div className="skeleton h-64 rounded-[20px]" />
        <div className="skeleton h-64 rounded-[20px]" />
      </div>
    </div>
  );

  const hasActive = consents.some(c => !c.revoked_at);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-caption mb-2 flex items-center gap-2">
            <span className="dot dot-live" style={{ background: "var(--color-ink-muted)" }} />Account
          </p>
          <h1 className="text-heading">Settings</h1>
        </div>
      </Reveal>

      {/* Profile hero card */}
      <Reveal delay={0.05}>
        <motion.div
          whileHover={{ y: -3 }}
          className="bento bento-dark p-7 relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-24 -right-24 w-72 h-72 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 60%)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex items-center gap-5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold relative"
              style={{ background: "rgba(212,160,23,0.18)", color: "var(--color-gold-light)", border: "1px solid rgba(212,160,23,0.3)" }}
            >
              {user?.name?.[0]?.toUpperCase()}
              <motion.div
                className="absolute -inset-1 rounded-2xl"
                style={{ background: "radial-gradient(circle, rgba(212,160,23,0.3), transparent 70%)" }}
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-cream)" }}>{user?.name}</h2>
                {user?.role === "admin" && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: "rgba(212,160,23,0.2)", color: "var(--color-gold-light)", border: "1px solid rgba(212,160,23,0.3)" }}
                  >
                    <Crown className="h-2.5 w-2.5" />Admin
                  </motion.span>
                )}
              </div>
              <p className="text-sm opacity-60 flex items-center gap-1.5">
                <User className="h-3 w-3" />{user?.email}
              </p>
            </div>
          </div>
        </motion.div>
      </Reveal>

      {/* Consent + Audit */}
      <div className="grid md:grid-cols-2 gap-4">
        <Reveal delay={0.1}>
          <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6 w-full h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
                  <Shield className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
                </div>
                <p className="text-caption">Consent History</p>
              </div>
              {hasActive && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium"
                  style={{ color: "var(--color-clay)", border: "1px solid rgba(198,93,58,0.2)" }}
                >
                  <ShieldX className="h-3 w-3" />{revoking ? "..." : "Revoke"}
                </motion.button>
              )}
            </div>
            {consents.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--color-ink-muted)" }}>No consent events.</p>
            ) : (
              <div className="space-y-2">
                {consents.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex justify-between items-center text-sm p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.5)" }}
                  >
                    <div>
                      <span style={{ color: "var(--color-ink-soft)" }}>{c.consent_type.replace(/_/g, " ")}</span>
                      {c.revoked_at && (
                        <span className="ml-2 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(198,93,58,0.1)", color: "var(--color-clay)" }}>Revoked</span>
                      )}
                    </div>
                    <span className="text-xs font-mono" style={{ color: "var(--color-ink-muted)" }}>{formatDateTime(c.accepted_at)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </Reveal>

        <Reveal delay={0.15}>
          <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6 w-full h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}>
                <ScrollText className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
              </div>
              <p className="text-caption">Audit Log</p>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--color-ink-muted)" }}>No entries.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
                {logs.slice(0, 15).map((l, i) => (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex justify-between items-center text-xs p-2 rounded"
                    style={{ background: "rgba(255,255,255,0.4)" }}
                  >
                    <span className="font-mono truncate" style={{ color: "var(--color-ink-soft)" }}>{l.action}</span>
                    <span className="text-[10px] font-mono ml-2" style={{ color: "var(--color-ink-muted)" }}>{formatDateTime(l.timestamp)}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </Reveal>
      </div>

      {/* Data Controls */}
      <Reveal delay={0.2}>
        <motion.div whileHover={{ y: -3 }} className="bento bento-warm p-6" style={{ borderLeft: "3px solid var(--color-gold)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,160,23,0.1)" }}>
              <Database className="h-4 w-4" style={{ color: "var(--color-gold)" }} />
            </div>
            <p className="text-caption">Data Controls</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              style={{ border: "1px solid var(--color-line)", color: "var(--color-ink-soft)", background: "var(--color-surface)" }}
            >
              <Download className="h-3.5 w-3.5" />Export My Data
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => { await logout(); navigate("dashboard"); }}
              className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5"
              style={{ background: "rgba(198,93,58,0.08)", color: "var(--color-clay)", border: "1px solid rgba(198,93,58,0.2)" }}
            >
              <LogOut className="h-3.5 w-3.5" />Logout
            </motion.button>
          </div>
        </motion.div>
      </Reveal>
    </div>
  );
}
