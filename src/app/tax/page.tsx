"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/app-layout";
import ProtectedRoute from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { tax } from "@/lib/api";
import { formatINR } from "@/lib/format";
import type { TaxSummary } from "@/lib/api";
import { FileWarning, Check } from "lucide-react";

export default function TaxPage() {
  return <ProtectedRoute><AppLayout><TaxContent /></AppLayout></ProtectedRoute>;
}
function TaxContent() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { tax.summary().then(setData).catch(() => setError("Failed to load")).finally(() => setLoading(false)); }, []);
  if (loading) return <Skeleton className="h-96" />;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;
  if (!data) return null;
  const r = data.regime_comparison;
  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Readiness</h1><p className="text-sm text-slate-400 mt-0.5">FY {data.financial_year}</p></div>

      {/* Score */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${data.score.score}%`, transition: "width 800ms" }} />
        <div className="flex items-center gap-2 mb-2"><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tax Readiness Score</span></div>
        <div className={`text-5xl font-bold tracking-tight animate-count ${data.score.score >= 70 ? "text-emerald-600" : "text-amber-500"}`}>{data.score.score}<span className="text-xl text-slate-300">/100</span></div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-slate-400">Doc Completeness</p><p className="font-bold text-slate-700">{data.score.breakdown.document_completeness}/40</p></div>
          <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-slate-400">Verification</p><p className="font-bold text-slate-700">{data.score.breakdown.data_verification}/25</p></div>
          <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-slate-400">Consistency</p><p className="font-bold text-slate-700">{data.score.breakdown.income_consistency}/20</p></div>
          <div className="bg-slate-50 rounded-lg p-2.5"><p className="text-slate-400">Deduction Proof</p><p className="font-bold text-slate-700">{data.score.breakdown.deduction_proof}/15</p></div>
        </div>
      </div>

      {/* Regime comparison */}
      <div className="glass rounded-2xl p-6 animate-slide-up stagger-1">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Old vs New Regime</span>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className={`rounded-xl p-4 border-2 transition-all ${r.recommended_regime === "old" ? "border-emerald-300 bg-emerald-50/30" : "border-slate-100"}`}>
            <div className="flex items-center justify-between mb-3"><span className="font-semibold text-slate-700">Old Regime</span>{r.recommended_regime === "old" && <Badge className="bg-emerald-100 text-emerald-700">Recommended</Badge>}</div>
            <div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-slate-400">Taxable</span><span className="font-medium">{formatINR(r.old_regime.taxable_income)}</span></div><div className="flex justify-between"><span className="text-slate-400">Tax + Cess</span><span className="font-bold text-slate-900">{formatINR(r.old_regime.total_tax)}</span></div></div>
          </div>
          <div className={`rounded-xl p-4 border-2 transition-all ${r.recommended_regime === "new" ? "border-emerald-300 bg-emerald-50/30" : "border-slate-100"}`}>
            <div className="flex items-center justify-between mb-3"><span className="font-semibold text-slate-700">New Regime</span>{r.recommended_regime === "new" && <Badge className="bg-emerald-100 text-emerald-700">Recommended</Badge>}</div>
            <div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-slate-400">Taxable</span><span className="font-medium">{formatINR(r.new_regime.taxable_income)}</span></div><div className="flex justify-between"><span className="text-slate-400">Tax + Cess</span><span className="font-bold text-slate-900">{formatINR(r.new_regime.total_tax)}</span></div></div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-medium"><Check className="h-4 w-4" />{r.recommended_regime} regime saves you {formatINR(r.savings_amount)}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5 animate-slide-up stagger-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income Summary</span>
          <div className="mt-3 space-y-2 text-sm">
            {Object.entries(data.income_summary).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-slate-500 capitalize">{k}</span><span className="font-medium text-slate-900">{formatINR(v)}</span></div>)}
          </div>
        </div>
        {data.missing_documents.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-slide-up stagger-3 border-l-4 border-amber-400">
            <div className="flex items-center gap-2 mb-3"><FileWarning className="h-4 w-4 text-amber-500" /><span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Missing Documents</span></div>
            <div className="space-y-2">{data.missing_documents.map((m, i) => <div key={i} className="flex items-start gap-2 text-sm"><Badge variant={m.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">{m.severity}</Badge><span className="text-slate-600">{m.reason}</span></div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
