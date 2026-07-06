"use client";
import { useEffect, useState } from "react";
import { tax } from "@/lib/api";
import { formatINR } from "@/lib/format";
import type { TaxSummary } from "@/lib/api";
import { FileWarning, Check } from "lucide-react";

export default function TaxContent() {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { tax.summary().then(setData).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!data) return null;
  const r = data.regime_comparison;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">FY {data.financial_year}</p><h1 className="text-heading">Tax Readiness</h1></div>

      {/* Bento: Score (dark) + Breakdown chips (light) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2 row-span-2 bento bento-dark p-7 animate-slide-up stagger-1 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-5" style={{ background: "var(--color-gold)" }} />
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50 mb-2">Tax Readiness Score</p>
          <div className="flex items-baseline gap-1.5"><span className="text-display font-mono animate-count">{data.score.score}</span><span className="text-lg opacity-40">/100</span></div>
          <div className="my-4 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(250,247,242,0.1)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${data.score.score}%`, background: "var(--color-gold)" }} /></div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[["Doc Completeness", data.score.breakdown.document_completeness, 40], ["Verification", data.score.breakdown.data_verification, 25], ["Consistency", data.score.breakdown.income_consistency, 20], ["Deduction Proof", data.score.breakdown.deduction_proof, 15]].map(([label, val, max]: any) => (
              <div key={label}><p className="text-[9px] uppercase tracking-wider opacity-50">{label}</p><p className="text-sm font-mono font-semibold mt-0.5">{val}/{max}</p></div>
            ))}
          </div>
        </div>

        {/* Old regime */}
        <div className="bento bento-light p-5 animate-slide-up stagger-2" style={r.recommended_regime === "old" ? { borderColor: "var(--color-forest)", borderWidth: "2px" } : {}}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>Old Regime</span>{r.recommended_regime === "old" && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>Best</span>}</div>
          <p className="text-label mb-1">Total Tax</p><p className="text-xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>{formatINR(r.old_regime.total_tax)}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--color-ink-muted)" }}>Taxable: {formatINR(r.old_regime.taxable_income)}</p>
        </div>

        {/* New regime */}
        <div className="bento bento-light p-5 animate-slide-up stagger-3" style={r.recommended_regime === "new" ? { borderColor: "var(--color-forest)", borderWidth: "2px" } : {}}>
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>New Regime</span>{r.recommended_regime === "new" && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>Best</span>}</div>
          <p className="text-label mb-1">Total Tax</p><p className="text-xl font-mono font-bold" style={{ color: "var(--color-ink)" }}>{formatINR(r.new_regime.total_tax)}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--color-ink-muted)" }}>Taxable: {formatINR(r.new_regime.taxable_income)}</p>
        </div>

        {/* Savings callout — gold card */}
        <div className="col-span-2 bento bento-gold p-5 animate-slide-up stagger-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "rgba(250,247,242,0.15)" }}><Check className="h-5 w-5" style={{ color: "var(--color-cream)" }} /></div>
          <div><p className="text-[10px] uppercase tracking-wider opacity-70">With {r.recommended_regime} regime you save</p><p className="text-xl font-mono font-bold">{formatINR(r.savings_amount)}</p></div>
        </div>
      </div>

      {/* Income + Missing docs */}
      <div className="grid md:grid-cols-2 gap-4 animate-slide-up stagger-5">
        <div className="bento bento-light p-6">
          <p className="text-caption mb-4">Income Summary</p>
          <div className="space-y-2.5 text-sm">{Object.entries(data.income_summary).map(([k, v]) => <div key={k} className="flex justify-between items-center"><span className="capitalize" style={{ color: "var(--color-ink-muted)" }}>{k}</span><span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{formatINR(v)}</span></div>)}</div>
        </div>
        {data.missing_documents.length > 0 && (
          <div className="bento bento-light p-6" style={{ borderLeft: "3px solid var(--color-clay)" }}>
            <div className="flex items-center gap-2 mb-3"><FileWarning className="h-4 w-4" style={{ color: "var(--color-clay)" }} /><p className="text-caption">Missing Documents</p></div>
            <div className="space-y-2">{data.missing_documents.map((m, i) => <div key={i} className="text-sm flex items-start gap-2"><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5" style={{ background: m.severity === "high" ? "rgba(198,93,58,0.1)" : "rgba(212,160,23,0.1)", color: m.severity === "high" ? "var(--color-clay)" : "var(--color-gold)" }}>{m.severity}</span><span style={{ color: "var(--color-ink-soft)" }}>{m.reason}</span></div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
