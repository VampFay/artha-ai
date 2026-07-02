"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import ProtectedRoute from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { consent, audit } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Consent, AuditLogEntry } from "@/lib/api";
import { Shield, Database, ScrollText, Download, LogOut, ShieldX } from "lucide-react";

export default function SettingsPage() {
  return <ProtectedRoute><AppLayout><SettingsContent /></AppLayout></ProtectedRoute>;
}
function SettingsContent() {
  const { user, logout } = useAuth();
  const [consents, setConsents] = useState<Consent[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState(false);
  const { toast } = useToast();

  const load = () => {
    Promise.all([consent.history(), audit.list()])
      .then(([c, a]) => { setConsents(c.items); setLogs(a.items); setError(""); })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch("/api/users/me/export", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finsight_export_${user?.id || "data"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported successfully!" });
    } catch (e: any) { toast({ title: "Export failed", description: e.message, variant: "destructive" }); }
  };

  const handleRevokeConsent = async () => {
    if (!confirm("Are you sure? You won't be able to upload documents until you re-accept consent.")) return;
    setRevoking(true);
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch("/api/consent/revoke", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Revoke failed");
      toast({ title: "Consent revoked." });
      load();
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setRevoking(false); }
  };

  if (loading) return <Skeleton className="h-96" />;
  const hasActiveConsent = consents.some((c) => c.consent_type === "document_processing" && !c.revoked_at);

  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Profile */}
      <div className="glass rounded-2xl p-5 animate-slide-up flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">{user?.name?.[0]?.toUpperCase()}</div>
        <div className="flex-1"><p className="font-semibold text-slate-900">{user?.name}</p><p className="text-sm text-slate-400">{user?.email}</p></div>
        {user?.role === "admin" && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Admin</span>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Consent history + revoke */}
        <div className="glass rounded-2xl p-5 animate-slide-up stagger-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Consent History</span></div>
            {hasActiveConsent && <Button size="sm" variant="outline" onClick={handleRevokeConsent} disabled={revoking} className="text-red-500 border-red-200 hover:bg-red-50"><ShieldX className="h-3 w-3 mr-1" />{revoking ? "Revoking..." : "Revoke"}</Button>}
          </div>
          {consents.length === 0 ? <p className="text-sm text-slate-400">No consent events.</p> : <div className="space-y-2">{consents.map((c) => <div key={c.id} className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0"><span className="text-slate-600">{c.consent_type}</span><div className="text-right"><p className="text-xs text-slate-500">{formatDateTime(c.accepted_at)}</p>{c.revoked_at && <p className="text-xs text-red-400">Revoked {formatDateTime(c.revoked_at)}</p>}</div></div>)}</div>}
        </div>

        {/* Audit log */}
        <div className="glass rounded-2xl p-5 animate-slide-up stagger-2">
          <div className="flex items-center gap-2 mb-3"><ScrollText className="h-4 w-4 text-sky-500" /><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Audit Log</span></div>
          {logs.length === 0 ? <p className="text-sm text-slate-400">No entries.</p> : <div className="space-y-1.5 max-h-48 overflow-y-auto">{logs.slice(0, 15).map((l) => <div key={l.id} className="flex justify-between text-xs py-1"><span className="font-mono text-slate-600">{l.action}</span><span className="text-slate-400">{formatDateTime(l.timestamp)}</span></div>)}</div>}
        </div>
      </div>

      {/* Data controls */}
      <div className="glass rounded-2xl p-5 animate-slide-up stagger-3">
        <div className="flex items-center gap-2 mb-3"><Database className="h-4 w-4 text-violet-500" /><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Data Controls</span></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-3.5 w-3.5 mr-1" />Export Data (JSON)</Button>
          <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem("finsight_token"); logout(); window.location.href = "/login"; }}><LogOut className="h-3.5 w-3.5 mr-1" />Logout</Button>
        </div>
      </div>
    </div>
  );
}
