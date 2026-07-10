"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntityDetail, type EntityTaxBreakdown } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Loader2, Calculator, TrendingUp, Lightbulb, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntityTaxView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [breakdown, setBreakdown] = useState<EntityTaxBreakdown | null>(null);
  const [regimeComparison, setRegimeComparison] = useState<any>(null);
  const [computing, setComputing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [grossIncome, setGrossIncome] = useState("10000000");
  const [section80C, setSection80C] = useState("150000");
  const [section80D, setSection80D] = useState("25000");
  const [depreciation, setDepreciation] = useState("500000");
  const [gstOutput, setGstOutput] = useState("1800000");
  const [gstInput, setGstInput] = useState("1200000");
  const [tdsDeducted, setTdsDeducted] = useState("500000");
  const [advanceTaxPaid, setAdvanceTaxPaid] = useState("800000");
  const [avgNetProfit, setAvgNetProfit] = useState("8000000");

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    entitiesApi.get(entityId)
      .then((res) => {
        setEntity(res.data);
        // Try to load existing tax profile
        return entitiesApi.taxSummary.get(entityId);
      })
      .then((res) => {
        if (res?.data?.breakdown) {
          setBreakdown(res.data.breakdown);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entityId]);

  const handleCompute = async () => {
    if (!entity) return;
    setComputing(true);
    try {
      const isGstApplicable = entity.entityTypeDef?.gstApplicable;
      const isCsrApplicable = entity.entityTypeDef?.csrApplicable;
      const res = await entitiesApi.taxSummary.compute(entity.id, {
        financialYear: "2024-25",
        grossIncome: parseFloat(grossIncome) || 0,
        deductions: {
          section80C: parseFloat(section80C) || 0,
          section80D: parseFloat(section80D) || 0,
          depreciation: parseFloat(depreciation) || 0,
        },
        gst: isGstApplicable ? {
          outputTax: parseFloat(gstOutput) || 0,
          inputTaxCredit: parseFloat(gstInput) || 0,
          rcmLiability: 0,
        } : undefined,
        tdsDeducted: parseFloat(tdsDeducted) || 0,
        advanceTaxPaid: parseFloat(advanceTaxPaid) || 0,
        avgNetProfit3yr: isCsrApplicable ? parseFloat(avgNetProfit) || 0 : undefined,
      });
      setBreakdown(res.data.breakdown);
      setRegimeComparison(res.data.regimeComparison);
    } catch (err: any) {
      console.error("Tax compute failed:", err);
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-saffron" />
        </div>
      </div>
    );
  }

  if (!entity) return null;

  const isGstApplicable = entity.entityTypeDef?.gstApplicable;
  const isCsrApplicable = entity.entityTypeDef?.csrApplicable;
  const isConcessional = entity.entityTypeDef?.taxRegime === "cit_new_115baa" || entity.entityTypeDef?.taxRegime === "cit_new_mfg_115bab";

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      <div className="mb-8">
        <button
          onClick={() => navigate("entity-dashboard", { entity_id: entity.id })}
          className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{entity.iconEmoji}</span>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">Tax Computation</h1>
        </div>
        <p className="text-stone text-sm">
          {entity.name} · {entity.entityTypeDef?.taxRegime?.replace(/_/g, " ")} · FY 2024-25
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input panel */}
        <div>
          <h2 className="text-sm font-bold tracking-wider text-carbon uppercase mb-4">Financial Inputs</h2>

          <div className="bg-white border border-carbon/10 rounded-2xl p-5 space-y-4">
            <InputField label="Gross Income (₹)" value={grossIncome} onChange={setGrossIncome} placeholder="10000000" />

            {!isConcessional && (
              <>
                <div className="border-t border-carbon/5 pt-4">
                  <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">Deductions</p>
                  <div className="space-y-3">
                    <InputField label="Section 80C (max ₹1.5L)" value={section80C} onChange={setSection80C} placeholder="150000" />
                    <InputField label="Section 80D (Health Insurance)" value={section80D} onChange={setSection80D} placeholder="25000" />
                    <InputField label="Depreciation" value={depreciation} onChange={setDepreciation} placeholder="500000" />
                  </div>
                </div>
              </>
            )}
            {isConcessional && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                <p>Concessional regime (§115BAA/BAB) does not allow deductions. Only depreciation (already in P&L) applies.</p>
              </div>
            )}

            {isGstApplicable && (
              <div className="border-t border-carbon/5 pt-4">
                <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">GST</p>
                <div className="space-y-3">
                  <InputField label="Output Tax (GST on Sales)" value={gstOutput} onChange={setGstOutput} placeholder="1800000" />
                  <InputField label="Input Tax Credit" value={gstInput} onChange={setGstInput} placeholder="1200000" />
                </div>
              </div>
            )}

            <div className="border-t border-carbon/5 pt-4">
              <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">Tax Credits</p>
              <div className="space-y-3">
                <InputField label="TDS Deducted" value={tdsDeducted} onChange={setTdsDeducted} placeholder="500000" />
                <InputField label="Advance Tax Paid" value={advanceTaxPaid} onChange={setAdvanceTaxPaid} placeholder="800000" />
              </div>
            </div>

            {isCsrApplicable && (
              <div className="border-t border-carbon/5 pt-4">
                <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">CSR (Section 135)</p>
                <InputField label="Avg Net Profit (last 3 yrs)" value={avgNetProfit} onChange={setAvgNetProfit} placeholder="8000000" />
              </div>
            )}

            <button
              onClick={handleCompute}
              disabled={computing}
              className="w-full mt-4 px-6 py-3 bg-saffron text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {computing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              {computing ? "Computing..." : "Compute Tax Liability"}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div>
          <h2 className="text-sm font-bold tracking-wider text-carbon uppercase mb-4">Tax Liability</h2>

          {breakdown ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Hero number */}
              <div className="p-6 bg-gradient-to-br from-saffron/10 to-saffron/5 border border-saffron/20 rounded-2xl mb-4">
                <p className="text-[10px] font-bold text-saffron uppercase tracking-widest mb-1">Total Tax Burden</p>
                <p className="text-4xl font-light text-carbon">₹{formatNumber(breakdown.totalTaxBurden)}</p>
                <p className="text-[10px] text-stone mt-1">
                  Effective rate: {(breakdown.effectiveTaxRate * 100).toFixed(2)}% of gross income
                </p>
              </div>

              {/* Breakdown */}
              <div className="bg-white border border-carbon/10 rounded-2xl p-5 mb-4">
                <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">Breakdown</p>
                <div className="space-y-2">
                  <Row label="Gross Income" value={breakdown.grossIncome} />
                  <Row label="Total Deductions" value={breakdown.totalDeductions} negative />
                  <Row label="Taxable Income" value={breakdown.taxableIncome} bold />
                  <div className="border-t border-carbon/5 my-2" />
                  <Row label="Base Tax" value={breakdown.baseTax} />
                  {breakdown.surcharge > 0 && <Row label="Surcharge" value={breakdown.surcharge} />}
                  <Row label="Health & Education Cess (4%)" value={breakdown.cess} />
                  {breakdown.mat > 0 && breakdown.mat > breakdown.totalIncomeTax && (
                    <Row label="MAT (applies instead)" value={breakdown.mat} highlight />
                  )}
                  {breakdown.matCreditUsed > 0 && <Row label="MAT Credit Used" value={breakdown.matCreditUsed} negative />}
                  <div className="border-t border-carbon/5 my-2" />
                  <Row label="Net Income Tax Payable" value={breakdown.netTaxPayable} bold />
                </div>
              </div>

              {/* Other taxes */}
              {(breakdown.gstNetPayable > 0 || breakdown.csrLiability > 0 || breakdown.professionalTax > 0 || breakdown.sttCtt > 0 || breakdown.stampDuty > 0 || breakdown.customsDuty > 0 || breakdown.equalisationLevy > 0) && (
                <div className="bg-white border border-carbon/10 rounded-2xl p-5 mb-4">
                  <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3">Other Taxes</p>
                  <div className="space-y-2">
                    {breakdown.gstNetPayable > 0 && <Row label="GST Net Payable" value={breakdown.gstNetPayable} />}
                    {breakdown.csrLiability > 0 && <Row label="CSR Liability (2%)" value={breakdown.csrLiability} />}
                    {breakdown.professionalTax > 0 && <Row label="Professional Tax" value={breakdown.professionalTax} />}
                    {breakdown.sttCtt > 0 && <Row label="STT / CTT" value={breakdown.sttCtt} />}
                    {breakdown.stampDuty > 0 && <Row label="Stamp Duty" value={breakdown.stampDuty} />}
                    {breakdown.customsDuty > 0 && <Row label="Customs Duty" value={breakdown.customsDuty} />}
                    {breakdown.equalisationLevy > 0 && <Row label="Equalisation Levy" value={breakdown.equalisationLevy} />}
                  </div>
                </div>
              )}

              {/* Regime comparison */}
              {regimeComparison && regimeComparison.savings > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-carbon">Regime Comparison</p>
                      <p className="text-xs text-stone mt-1">
                        {regimeComparison.recommendation === "new"
                          ? `Concessional regime (§115BAA) saves ₹${formatNumber(regimeComparison.savings)} vs default regime.`
                          : `Default regime saves ₹${formatNumber(regimeComparison.savings)} vs concessional regime.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {breakdown.recommendations.length > 0 && (
                <div className="bg-white border border-carbon/10 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Lightbulb className="w-3 h-3 text-saffron" /> Recommendations
                  </p>
                  <ul className="space-y-2">
                    {breakdown.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-carbon flex items-start gap-2">
                        <span className="text-saffron mt-0.5">→</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white border border-dashed border-carbon/10 rounded-2xl p-12 text-center">
              <Calculator className="w-10 h-10 text-stone/30 mx-auto mb-4" />
              <p className="text-sm text-stone mb-1">No tax computed yet</p>
              <p className="text-[11px] text-stone/60">Enter your financial inputs and click "Compute Tax Liability"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/40 text-sm">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron transition-colors"
        />
      </div>
    </div>
  );
}

function Row({ label, value, negative, bold, highlight }: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn("text-stone", bold && "text-carbon font-medium")}>{label}</span>
      <span className={cn(
        "font-mono",
        bold ? "text-carbon font-bold text-sm" : highlight ? "text-amber-600 font-medium" : "text-carbon"
      )}>
        {negative ? "−" : ""}₹{formatNumber(value)}
      </span>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (Math.abs(n) >= 100000) return `${(n / 100000).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}
