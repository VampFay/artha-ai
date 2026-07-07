"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Users, Shield, ShieldAlert, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Nominee { id: string; name: string; relation: string; allocation: number; status: string; assets: string[]; }
interface Will { id: string; name: string; docType: string; uploadedAt: string; }

export default function EstateView() {
  const [activeTab, setActiveTab] = useState<"nominees" | "wills">("nominees");
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [wills, setWills] = useState<Will[]>([]);
  const [audit, setAudit] = useState<{ unassignedAssetsCount: number; auditMessage: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNomineeForm, setShowNomineeForm] = useState(false);
  const [nomineeForm, setNomineeForm] = useState({ name: "", relation: "", allocation: "" });

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    fetch("/api/estate/nominees", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setNominees(d.nominees || []);
        setWills(d.wills || []);
        setAudit(d.audit || null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
      <div className="skeleton h-16 w-64 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="skeleton h-48" /><div className="skeleton h-48" /><div className="skeleton h-32" /></div>
    </div>
  );

  return (
    <div className="flex flex-col px-6 lg:px-12 max-w-[1200px] mx-auto w-full">
      <div className="pt-8 pb-6 border-b border-carbon/10 mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Estate & Succession</span>
        </motion.div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2">Estate Planning</h1>
            <p className="text-sm text-stone max-w-xl">Secure your legacy. Manage your nominees, wills, and succession planning to ensure a smooth transition of your wealth.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab("nominees")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "nominees" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Nominees</button>
            <button onClick={() => setActiveTab("wills")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "wills" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Wills & Trusts</button>
          </div>
        </div>
      </div>

      {activeTab === "nominees" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Registered Nominees</h3>
              <button onClick={() => setShowNomineeForm(!showNomineeForm)} className="text-xs text-carbon font-medium hover:text-saffron transition-colors flex items-center gap-1">
                <Users className="w-3 h-3" /> {showNomineeForm ? "Cancel" : "Add Nominee"}
              </button>
            </div>
            {showNomineeForm && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const token = localStorage.getItem("finsight_token");
                try {
                  await fetch("/api/estate/nominees", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: nomineeForm.name, relation: nomineeForm.relation, allocation: Number(nomineeForm.allocation), assets: [] }) });
                  setShowNomineeForm(false);
                  setNomineeForm({ name: "", relation: "", allocation: "" });
                  // Reload nominees
                  fetch("/api/estate/nominees", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { setNominees(d.nominees || []); setAudit(d.audit || null); });
                } catch {}
              }} className="mb-6 p-6 border border-carbon/10 bg-[#FAFAFA] space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={nomineeForm.name} onChange={e => setNomineeForm({ ...nomineeForm, name: e.target.value })} placeholder="Name" required className="px-3 py-2 rounded-lg border border-stone/20 bg-white text-sm" />
                  <input type="text" value={nomineeForm.relation} onChange={e => setNomineeForm({ ...nomineeForm, relation: e.target.value })} placeholder="Relation" required className="px-3 py-2 rounded-lg border border-stone/20 bg-white text-sm" />
                  <input type="number" value={nomineeForm.allocation} onChange={e => setNomineeForm({ ...nomineeForm, allocation: e.target.value })} placeholder="Allocation %" required className="px-3 py-2 rounded-lg border border-stone/20 bg-white text-sm" />
                </div>
                <button type="submit" className="px-4 py-2 bg-carbon text-white text-xs font-bold uppercase tracking-wider rounded-lg">Add Nominee</button>
              </form>
            )}
            {nominees.length === 0 ? (
              <div className="p-12 border border-carbon/10 bg-[#FAFAFA] text-center">
                <Users className="w-10 h-10 text-stone/30 mx-auto mb-3" />
                <p className="text-sm text-stone">No nominees registered yet.</p>
                <p className="text-xs text-stone/60 mt-1">Add a nominee to ensure your assets are distributed per your wishes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {nominees.map((n, i) => (
                  <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-6 border border-carbon/10 bg-[#FAFAFA]">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-carbon">{n.name}</h4>
                        <p className="text-xs text-stone">{n.relation}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {n.allocation > 0 && <span className="text-xs font-pixel text-carbon">{n.allocation}%</span>}
                        <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded", n.status === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-saffron/10 text-saffron")}>{n.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {n.assets.map((a, j) => (
                        <span key={j} className="text-[10px] text-stone bg-white px-2 py-1 rounded border border-carbon/5">{a}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-carbon text-white">
              <Shield className="w-5 h-5 text-saffron mb-4" />
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-3">Audit Status</h3>
              <p className="text-xs text-stone-light leading-relaxed">{audit?.auditMessage || "All assets have nominees assigned."}</p>
              {audit && audit.unassignedAssetsCount > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-2xl font-light text-saffron">{audit.unassignedAssetsCount}</p>
                  <p className="text-[10px] text-stone uppercase tracking-wider">Unassigned Assets</p>
                </div>
              )}
            </div>
            {audit && audit.unassignedAssetsCount > 0 && (
              <div className="p-6 border border-saffron/20 bg-saffron/5">
                <ShieldAlert className="w-5 h-5 text-saffron mb-3" />
                <p className="text-xs text-carbon-light leading-relaxed mb-3">Resolve unassigned assets to ensure your estate is fully protected.</p>
                <button className="text-xs text-saffron font-bold uppercase tracking-wider hover:text-carbon transition-colors flex items-center gap-1">Review Assets <ArrowRight className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {wills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-12 h-12 text-stone-light mb-6" />
              <h2 className="text-xl font-medium text-carbon mb-2">No Wills or Trusts Uploaded</h2>
              <p className="text-sm text-stone max-w-md mb-8">Upload your will, trust documents, or power of attorney to keep them securely stored and accessible to your nominees.</p>
              <button className="px-6 py-3 bg-carbon text-white text-xs font-bold uppercase tracking-wider hover:bg-carbon/90 transition-colors">Upload Document</button>
            </div>
          ) : (
            <div className="space-y-4">
              {wills.map((w, i) => (
                <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-6 border border-carbon/10 bg-[#FAFAFA] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-stone" />
                    <div><h4 className="text-sm font-medium text-carbon">{w.name}</h4><p className="text-xs text-stone">{new Date(w.uploadedAt).toLocaleDateString("en-IN")}</p></div>
                  </div>
                  <button className="text-xs text-carbon font-medium hover:text-saffron">View</button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
