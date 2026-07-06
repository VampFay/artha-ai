"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LiquidProgress } from "@/components/ui/LiquidProgress";
import { KineticNumber } from "@/components/ui/KineticNumber";
import { CheckCircle2, TrendingDown, FileWarning, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TaxView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    fetch("/api/tax/summary", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto">
      <div className="skeleton h-12 w-48 mb-8" />
      <div className="skeleton h-48 rounded-3xl mb-8" />
      <div className="skeleton h-32 rounded-3xl mb-8" />
      <div className="grid md:grid-cols-2 gap-6"><div className="skeleton h-64 rounded-3xl" /><div className="skeleton h-64 rounded-3xl" /></div>
    </div>
  );

  const score = data?.score?.score ?? 0;
  const breakdown = data?.score?.breakdown ?? {};
  const missing = data?.missing_documents ?? [];
  const r = data?.regime_comparison ?? { old_regime: {}, new_regime: {}, savings_amount: 0, recommended_regime: "new" };
  const dashOffset = 283 - (score / 100) * 283;

  const breakdownItems = [
    { label: "Document Completeness", val: breakdown.document_completeness ?? 0, max: 40 },
    { label: "Data Verification", val: breakdown.data_verification ?? 0, max: 25 },
    { label: "Income Consistency", val: breakdown.income_consistency ?? 0, max: 20 },
    { label: "Deduction Proofs", val: breakdown.deduction_proof ?? 0, max: 15 },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full pb-20">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Tax Readiness</h1>
          <p className="text-stone">AI-driven analysis of your tax profile for FY {data?.financial_year || "2024-25"}.</p>
        </header>

        {/* Hero Card */}
        <section className="bg-carbon text-canvas rounded-3xl p-8 mb-8 relative overflow-hidden border border-carbon-light">
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-white/10" strokeWidth="8" />
                <motion.circle cx="50" cy="50" r="45" fill="none" className="stroke-saffron drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" strokeWidth="8" strokeLinecap="round" strokeDasharray="283" initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 1.5, ease: "easeOut" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <KineticNumber value={score} className="text-4xl font-semibold tracking-tighter" />
                <span className="text-stone font-medium text-sm">Score</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-5">
              <h3 className="text-lg font-medium text-white/90 mb-2">Readiness Breakdown</h3>
              {breakdownItems.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-stone">{item.label}</span>
                    <span className="text-sm font-semibold text-white/90">{item.val}/{item.max} pts</span>
                  </div>
                  <LiquidProgress value={item.val} max={item.max} indicatorClassName="bg-saffron" className="bg-white/10 h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Missing Documents */}
        {missing.length > 0 && (
          <section className="mb-8 space-y-4">
            {missing.map((m: any, i: number) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1"><FileWarning className="w-5 h-5 text-amber-600" /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-amber-900">Missing Document</h3>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", m.severity === "high" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800")}>{m.severity}</span>
                  </div>
                  <p className="text-amber-800/80 text-sm">{m.reason}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {missing.length === 0 && (
          <section className="mb-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Info className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-900">All Documents Captured</h3>
                <p className="text-emerald-800/80 text-sm">Your tax profile is complete. You're ready to file.</p>
              </div>
            </div>
          </section>
        )}

        {/* Regime Comparison */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-carbon mb-6">Regime Comparison</h2>
          <div className="mb-6 bg-gradient-to-r from-saffron to-saffron-light rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-saffron/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0"><TrendingDown className="w-6 h-6 text-white" /></div>
              <div>
                <p className="text-white/90 font-medium">Recommendation</p>
                <h3 className="text-xl font-semibold capitalize">Switch to {r.recommended_regime} Regime</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/90 font-medium text-sm">Estimated Savings</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg">₹</span>
                <KineticNumber value={r.savings_amount} format={v => Math.round(v).toLocaleString("en-IN")} className="text-3xl font-bold tracking-tight" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime */}
            <div className={cn("bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden transition-opacity", r.recommended_regime === "old" ? "border-2 border-saffron opacity-100" : "border-stone/10 opacity-60 hover:opacity-100")}>
              {r.recommended_regime === "old" && <div className="absolute top-4 right-4 bg-saffron text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Best Choice</div>}
              <h3 className="text-lg font-medium text-stone mb-8">Old Regime</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm"><span className="text-stone">Gross Income</span><span className="font-medium text-carbon">₹{Math.round(r.old_regime?.gross_income || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-stone">Total Deductions</span><span className="font-medium text-emerald-600">-₹{Math.round(r.old_regime?.total_deductions || 0).toLocaleString("en-IN")}</span></div>
                <div className="h-px bg-stone/10 w-full" />
                <div className="flex justify-between items-center font-medium"><span className="text-carbon">Taxable Income</span><span className="text-carbon">₹{Math.round(r.old_regime?.taxable_income || 0).toLocaleString("en-IN")}</span></div>
              </div>
              <div className="pt-6 border-t border-stone/10">
                <p className="text-sm font-medium text-stone mb-1">Total Tax Liability</p>
                <div className="flex items-baseline gap-1 text-carbon">
                  <span className="text-2xl font-medium">₹</span>
                  <KineticNumber value={Math.round(r.old_regime?.total_tax || 0)} format={v => v.toLocaleString("en-IN")} className="text-4xl font-semibold tracking-tight" />
                </div>
              </div>
            </div>

            {/* New Regime */}
            <div className={cn("bg-white rounded-3xl p-8 border shadow-sm relative overflow-hidden transition-opacity", r.recommended_regime === "new" ? "border-2 border-saffron opacity-100" : "border-stone/10 opacity-60 hover:opacity-100")}>
              {r.recommended_regime === "new" && <div className="absolute top-4 right-4 bg-saffron text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Best Choice</div>}
              <h3 className="text-lg font-semibold text-carbon mb-8">New Regime</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm"><span className="text-stone">Gross Income</span><span className="font-medium text-carbon">₹{Math.round(r.new_regime?.gross_income || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-stone">Standard Deduction</span><span className="font-medium text-emerald-600">-₹{Math.round(r.new_regime?.total_deductions || 0).toLocaleString("en-IN")}</span></div>
                <div className="h-px bg-stone/10 w-full" />
                <div className="flex justify-between items-center font-medium"><span className="text-carbon">Taxable Income</span><span className="text-carbon">₹{Math.round(r.new_regime?.taxable_income || 0).toLocaleString("en-IN")}</span></div>
              </div>
              <div className="pt-6 border-t border-stone/10">
                <p className="text-sm font-medium text-stone mb-1">Total Tax Liability</p>
                <div className="flex items-baseline gap-1 text-carbon">
                  <span className="text-2xl font-medium">₹</span>
                  <KineticNumber value={Math.round(r.new_regime?.total_tax || 0)} format={v => v.toLocaleString("en-IN")} className="text-4xl font-semibold tracking-tight" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
