"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import { consent, audit } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Consent, AuditLogEntry } from "@/lib/api";
import { Shield, Database, ScrollText, Download, LogOut, ShieldX } from "lucide-react";
const { useToast } = require("@/hooks/use-toast");
export default function SettingsContent() {
  const { user, logout } = useAuth(); const { navigate } = useNav();
  const [consents, setConsents] = useState<Consent[]>([]); const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true); const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();
  useEffect(() => { Promise.all([consent.history(), audit.list()]).then(([c, a]) => { setConsents(c.items); setLogs(a.items); }).finally(() => setLoading(false)); }, []);
  const handleExport = async () => { try { const t = localStorage.getItem("finsight_token"); const res = await fetch("/api/users/me/export", { headers: { Authorization: `Bearer ${t}` } }); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "finsight_export.json"; a.click(); URL.revokeObjectURL(url); toast({ title: "Exported!" }); } catch { toast({ title: "Failed", variant: "destructive" }); } };
  const handleRevoke = async () => { if (!confirm("Revoke consent?")) return; setRevoking(true); try { const t = localStorage.getItem("finsight_token"); await fetch("/api/consent/revoke", { method: "POST", headers: { Authorization: `Bearer ${t}` } }); toast({ title: "Revoked." }); consent.history().then(c => setConsents(c.items)); } catch {} finally { setRevoking(false); } };
  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  const hasActive = consents.some(c => !c.revoked_at);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">Account</p><h1 className="text-heading">Settings</h1></div>
      {/* Profile card */}
      <div className="bento bento-dark p-6 flex items-center gap-4 animate-slide-up stagger-1">
        <div className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "rgba(212,160,23,0.2)", color: "var(--color-gold)" }}>{user?.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1"><p className="font-semibold" style={{ color: "var(--color-cream)" }}>{user?.name}</p><p className="text-sm opacity-60">{user?.email}</p></div>
        {user?.role === "admin" && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded" style={{ background: "rgba(212,160,23,0.2)", color: "var(--color-gold)" }}>Admin</span>}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bento bento-light p-6 animate-slide-up stagger-2">
          <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Shield className="h-4 w-4" style={{ color: "var(--color-forest)" }} /><p className="text-caption">Consent History</p></div>{hasActive && <button onClick={handleRevoke} disabled={revoking} className="text-xs px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1" style={{ color: "var(--color-clay)", border: "1px solid rgba(198,93,58,0.2)" }}><ShieldX className="h-3 w-3" />{revoking ? "..." : "Revoke"}</button>}</div>
          {consents.length === 0 ? <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No consent events.</p> : <div className="space-y-2">{consents.map(c => <div key={c.id} className="flex justify-between text-sm py-1.5" style={{ borderBottom: "1px solid var(--color-line-soft)" }}><span style={{ color: "var(--color-ink-soft)" }}>{c.consent_type}</span><div className="text-right"><p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{formatDateTime(c.accepted_at)}</p>{c.revoked_at && <p className="text-xs" style={{ color: "var(--color-clay)" }}>Revoked</p>}</div></div>)}</div>}
        </div>
        <div className="bento bento-light p-6 animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-3"><ScrollText className="h-4 w-4" style={{ color: "var(--color-forest)" }} /><p className="text-caption">Audit Log</p></div>
          {logs.length === 0 ? <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No entries.</p> : <div className="space-y-1.5 max-h-48 overflow-y-auto">{logs.slice(0, 15).map(l => <div key={l.id} className="flex justify-between text-xs py-1"><span className="font-mono" style={{ color: "var(--color-ink-soft)" }}>{l.action}</span><span style={{ color: "var(--color-ink-muted)" }}>{formatDateTime(l.timestamp)}</span></div>)}</div>}
        </div>
      </div>
      <div className="bento bento-warm p-5 animate-slide-up stagger-4">
        <div className="flex items-center gap-2 mb-3"><Database className="h-4 w-4" style={{ color: "var(--color-forest)" }} /><p className="text-caption">Data Controls</p></div>
        <div className="flex gap-2"><button onClick={handleExport} className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors" style={{ border: "1px solid var(--color-line)", color: "var(--color-ink-soft)" }}><Download className="h-3.5 w-3.5" />Export Data</button><button onClick={async () => { await logout(); navigate("dashboard"); }} className="h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors" style={{ border: "1px solid var(--color-line)", color: "var(--color-ink-soft)" }}><LogOut className="h-3.5 w-3.5" />Logout</button></div>
      </div>
    </div>
  );
}
