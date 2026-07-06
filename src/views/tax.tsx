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
  if (loading) return <div className="skeleton h-96 rounded-lg" />;
  if (!data) return null;
  const r = data.regime_comparison;
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">Financial Year {data.financial_year}</p><h1 className="text-heading">Tax Readiness</h1></div>

      {/* Score */}
      <div className="card p-8 animate-slide-up stagger-1">
        <div className="flex items-end justify-between mb-4">
          <div><p className="text-label mb-1">Tax Readiness Score</p><div className="flex items-baseline gap-2"><span className="text-display font-mono" style={{ color: data.score.score >= 70 ? "var(--color-forest)" : "var(--color-clay)" }}>{data.score.score}</span><span className="text-lg" style={{ color: "var(--color-ink-muted)" }}>/100</span></div></div>
          <div className="text-right text-sm" style={{ color: "var(--color-ink-muted)" }}>
            <p>Doc Completeness <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{data.score.breakdown.document_completeness}/40</span></p>
            <p>Verification <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{data.score.breakdown.data_verification}/25</span></p>
            <p>Consistency <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{data.score.breakdown.income_consistency}/20</span></p>
            <p>Deduction Proof <span className="font-mono font-semibold" style={{ color: "var(--color-ink)" }}>{data.score.breakdown.deduction_proof}/15</span></p>
          </div>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-line)" }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${data.score.score}%`, background: "var(--color-forest)" }} /></div>
      </div>

      {/* Regime comparison */}
      <div className="card p-6 animate-slide-up stagger-2">
        <p className="text-caption mb-4">Old vs New Regime Comparison</p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: "Old Regime", taxable: r.old_regime.taxable_income, tax: r.old_regime.total_tax, recommended: r.recommended_regime === "old" },
            { name: "New Regime", taxable: r.new_regime.taxable_income, tax: r.new_regime.total_tax, recommended: r.recommended_regime === "new" },
          ].map((regime) => (
            <div key={regime.name} className="rounded-xl p-5 border-2 transition-all" style={regime.recommended ? { borderColor: "var(--color-forest)", background: "rgba(13,59,46,0.02)" } : { borderColor: "var(--color-line)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>{regime.name}</span>
                {regime.recommended && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>Recommended</span>}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span style={{ color: "var(--color-ink-muted)" }}>Taxable Income</span><span className="font-mono font-medium" style={{ color: "var(--color-ink)" }}>{formatINR(regime.taxable)}</span></div>
                <div className="flex justify-between"><span style={{ color: "var(--color-ink-muted)" }}>Total Tax</span><span className="font-mono font-bold text-base" style={{ color: "var(--color-ink)" }}>{formatINR(regime.tax)}</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-forest)" }}><Check className="h-4 w-4" />{r.recommended_regime} regime saves you {formatINR(r.savings_amount)}</div>
      </div>

      {/* Income + Missing docs */}
      <div className="grid md:grid-cols-2 gap-4 animate-slide-up stagger-3">
        <div className="card p-6">
          <p className="text-caption mb-4">Income Summary</p>
          <div className="space-y-2 text-sm">{Object.entries(data.income_summary).map(([k, v]) => <div key={k} className="flex justify-between"><span className="capitalize" style={{ color: "var(--color-ink-muted)" }}>{k}</span><span className="font-mono font-medium" style={{ color: "var(--color-ink)" }}>{formatINR(v)}</span></div>)}</div>
        </div>
        {data.missing_documents.length > 0 && (
          <div className="card p-6" style={{ borderLeft: "3px solid var(--color-clay)" }}>
            <div className="flex items-center gap-2 mb-3"><FileWarning className="h-4 w-4" style={{ color: "var(--color-clay)" }} /><p className="text-caption">Missing Documents</p></div>
            <div className="space-y-2">{data.missing_documents.map((m, i) => <div key={i} className="text-sm flex items-start gap-2"><span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5" style={{ background: m.severity === "high" ? "rgba(198,93,58,0.1)" : "rgba(212,160,23,0.1)", color: m.severity === "high" ? "var(--color-clay)" : "var(--color-gold)" }}>{m.severity}</span><span style={{ color: "var(--color-ink-soft)" }}>{m.reason}</span></div>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
