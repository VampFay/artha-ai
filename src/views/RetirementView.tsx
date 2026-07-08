"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { KineticNumber } from "@/components/ui/KineticNumber";

export default function RetirementView() {
  const [currentAge, setCurrentAge] = useState(32);
  const [targetAge, setTargetAge] = useState(50);
  const [monthlyExpense, setMonthlyExpense] = useState(150000);
  const [currentCorpus, setCurrentCorpus] = useState(4500000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulate = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch("/api/retirement/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentAge, targetAge, monthlyExpense, currentCorpus }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } catch (e: any) { alert("Failed to calculate. Try again."); } finally { setLoading(false); }
  }, [currentAge, targetAge, monthlyExpense, currentCorpus]);

  // Debounced API call on slider change
  useEffect(() => {
    const timer = setTimeout(simulate, 500);
    return () => clearTimeout(timer);
  }, [simulate]);

  const targetCorpus = result?.targetCorpus || 0;
  const requiredSIP = result?.requiredSIP || 0;
  const futureMonthlyExpense = result?.futureMonthlyExpense || 0;
  const trajectory = result?.trajectory || [];
  const inflationRate = result?.assumptions?.inflationRate || 0.06;
  const returnRate = result?.assumptions?.returnRate || 0.12;
  const withdrawalRate = result?.assumptions?.withdrawalRate || 0.04;
  const yearsToRetire = targetAge - currentAge;
  const maxCorpus = Math.max(...trajectory.map((t: any) => t.corpus), 1);

  return (
    <div className="flex flex-col px-6 lg:px-12 max-w-[1200px] mx-auto w-full pb-16">
      <div className="pt-8 pb-6 border-b border-carbon/10 mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Financial Independence</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2 font-michroma">Retirement & FIRE</h1>
        <p className="text-sm text-stone max-w-2xl">Simulate your path to Financial Independence and Early Retirement (FIRE) based on your current corpus, target age, and estimated lifestyle costs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1 space-y-8">
          <div className="bg-[#FAFAFA] p-8 border border-carbon/5 space-y-8">
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Variables</h3>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-stone">Current Age: {currentAge}</label>
              <input type="range" min="20" max="60" value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))} className="w-full accent-carbon" />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-stone">Target Retirement Age: {targetAge}</label>
              <input type="range" min={currentAge + 1} max="75" value={targetAge} onChange={(e) => setTargetAge(parseInt(e.target.value))} className="w-full accent-carbon" />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-stone">Today's Monthly Expense (₹{monthlyExpense.toLocaleString("en-IN")})</label>
              <input type="range" min="50000" max="500000" step="10000" value={monthlyExpense} onChange={(e) => setMonthlyExpense(parseInt(e.target.value))} className="w-full accent-carbon" />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-medium text-stone">Current Corpus (₹{(currentCorpus / 100000).toFixed(1)}L)</label>
              <input type="range" min="0" max="50000000" step="500000" value={currentCorpus} onChange={(e) => setCurrentCorpus(parseInt(e.target.value))} className="w-full accent-carbon" />
            </div>
            <div className="pt-4 border-t border-carbon/10 space-y-2 text-[10px] text-stone-dark">
              <p>Assumed Inflation: <span className="text-carbon">{(inflationRate * 100).toFixed(1)}%</span></p>
              <p>Assumed ROI (Pre-Retirement): <span className="text-carbon">{(returnRate * 100).toFixed(1)}%</span></p>
              <p>Safe Withdrawal Rate (SWR): <span className="text-carbon">{(withdrawalRate * 100).toFixed(1)}%</span></p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 border border-carbon/10">
              <h4 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-2">Target FIRE Corpus</h4>
              <div className="text-3xl font-light text-carbon mb-1">
                <span className="font-geist-pixel text-stone mr-1">₹</span>
                {loading ? <span className="text-stone">...</span> : <KineticNumber value={targetCorpus} />}
              </div>
              <p className="text-xs text-stone">To sustain ₹{Math.round(futureMonthlyExpense).toLocaleString("en-IN")}/mo at age {targetAge}</p>
            </div>
            <div className="p-8 bg-carbon text-white">
              <h4 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-2">Required Monthly SIP</h4>
              <div className="text-3xl font-light mb-1">
                <span className="font-geist-pixel text-stone mr-1">₹</span>
                {loading ? <span className="text-stone">...</span> : <KineticNumber value={Math.max(0, requiredSIP)} />}
              </div>
              <p className="text-xs text-stone">For the next {yearsToRetire} years</p>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Corpus Growth Trajectory</h3>
            <div className="h-64 flex items-end gap-1 relative border-b border-l border-carbon/20 pb-2 pl-2">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {[0, 25, 50, 75, 100].map(p => (
                  <div key={p} className="absolute w-full border-t border-carbon/5" style={{ bottom: `${p}%` }} />
                ))}
              </div>
              {trajectory.map((point: any, i: number) => {
                const heightPercentage = Math.min(100, (point.corpus / maxCorpus) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 0.8, delay: i * 0.03 }}
                      className={cn("w-full max-w-[12px] rounded-t-sm transition-colors", i === trajectory.length - 1 ? "bg-saffron" : "bg-carbon/80 group-hover:bg-carbon")}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[9px] font-bold tracking-widest text-stone uppercase">
              <span>Age {currentAge}</span>
              <span>Age {targetAge}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
