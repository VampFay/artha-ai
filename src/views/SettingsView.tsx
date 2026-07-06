"use client";
import { User } from "@/lib/types";
import { User as UserIcon, Shield, ShieldX, ScrollText, Database, Download, LogOut, Crown } from "lucide-react";
import { useState, useEffect } from "react";

interface SettingsViewProps { user: User; onLogout: () => void; }

export default function SettingsView({ user, onLogout }: SettingsViewProps) {
  const [consents, setConsents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    Promise.all([
      fetch("/api/consent/history", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ items: [] })),
      fetch("/api/audit-log", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([c, a]) => {
      setConsents(c.items || []);
      setLogs(a.items || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleRevoke = async () => {
    if (!confirm("Revoke consent? Features relying on it will stop working.")) return;
    const token = localStorage.getItem("finsight_token");
    try {
      await fetch("/api/consent/revoke", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const c = await fetch("/api/consent/history", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setConsents(c.items || []);
    } catch {}
  };

  const handleExport = async () => {
    const token = localStorage.getItem("finsight_token");
    const res = await fetch("/api/users/me/export", { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "finsight_export.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full pb-20">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Settings</h1>
          <p className="text-stone">Manage your profile, privacy, and data.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
            <div className="bg-carbon text-canvas rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center mb-4 shadow-lg shadow-saffron/20">
                  <span className="text-3xl font-bold text-white">{user.name.charAt(0)}</span>
                </div>
                <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
                <div className="flex items-center gap-2 text-stone">
                  <UserIcon className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.role === "admin" && (
                  <div className="mt-4 px-3 py-1 bg-saffron/20 border border-saffron/30 text-saffron-light text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> Admin
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-carbon/10 rounded-xl text-sm font-medium text-carbon hover:bg-carbon/5 transition-colors">
                <Download className="w-4 h-4" /> Export My Data
              </button>
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4" /> Log Out
              </button>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            {/* Consent History */}
            <div className="bg-white border border-carbon/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-carbon" />
                  <h3 className="text-sm font-semibold text-carbon">Consent History</h3>
                </div>
                {consents.some(c => !c.revoked_at) && (
                  <button onClick={handleRevoke} className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                    <ShieldX className="w-3 h-3" /> Revoke Active
                  </button>
                )}
              </div>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton h-12" />)}</div>
              ) : consents.length === 0 ? (
                <p className="text-sm text-stone py-4 text-center">No consent events.</p>
              ) : (
                <div className="space-y-2">
                  {consents.map(c => (
                    <div key={c.id} className="flex justify-between items-center py-2 border-b border-carbon/5 last:border-0">
                      <div>
                        <span className="text-sm text-carbon">{c.consent_type.replace(/_/g, " ")}</span>
                        {c.revoked_at && <span className="ml-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone/20 text-stone">Revoked</span>}
                      </div>
                      <span className="text-xs text-stone font-mono">{new Date(c.accepted_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log */}
            <div className="bg-white border border-carbon/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ScrollText className="w-4 h-4 text-carbon" />
                <h3 className="text-sm font-semibold text-carbon">Audit Log</h3>
              </div>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-8" />)}</div>
              ) : logs.length === 0 ? (
                <p className="text-sm text-stone py-4 text-center">No audit entries.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {logs.slice(0, 15).map(l => (
                    <div key={l.id} className="flex justify-between items-center text-xs py-1.5 px-2 hover:bg-carbon/5 rounded">
                      <span className="font-mono text-carbon">{l.action.replace(/_/g, " ")}</span>
                      <span className="text-stone">{new Date(l.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
