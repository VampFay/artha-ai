"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { KineticNumber } from "@/components/ui/KineticNumber";
import { TrendingUp, Activity } from "lucide-react";

interface Asset { id: string; name: string; assetClass: string; value: number; percentage: number; color: string; }
interface AllocationRow { name: string; actualPct: number; targetPct: number; }
interface PortfolioData {
  totalValue: number; irrPct: number; assets: Asset[];
  allocationTable: AllocationRow[]; insight: string;
}

export default function PortfolioView() {
  const [activeTab, setActiveTab] = useState<"allocation" | "performance">("allocation");
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    fetch("/api/portfolio/summary", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
      <div className="skeleton h-16 w-72 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><div className="skeleton h-64" /><div className="skeleton h-64" /></div>
    </div>
  );

  const assets = data?.assets || [];
  const allocationTable = data?.allocationTable || [];
  const totalValue = data?.totalValue || 0;
  const irrPct = data?.irrPct || 0;

  return (
    <div className="flex flex-col px-6 lg:px-12 max-w-[1200px] mx-auto w-full">
      <div className="pt-8 pb-6 border-b border-carbon/10 mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Portfolio Overview</span>
        </motion.div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon mb-2">
              <span className="font-michroma text-stone text-3xl md:text-5xl mr-2">₹</span>
              <KineticNumber value={totalValue} />
            </h1>
            <p className="text-xs font-geist-pixel text-stone-dark flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-saffron" />
              <span className="text-saffron">+{irrPct.toFixed(1)}%</span> IRR since inception
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab("allocation")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "allocation" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Allocation</button>
            <button onClick={() => setActiveTab("performance")} className={cn("text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors", activeTab === "performance" ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon")}>Performance</button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "allocation" ? (
          <motion.div key="allocation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-8">Asset Distribution</h3>
              {assets.length === 0 ? (
                <p className="text-sm text-stone py-12 text-center">No holdings on record.</p>
              ) : (
                <>
                  <div className="flex h-12 w-full rounded-sm overflow-hidden mb-8 gap-0.5">
                    {assets.map((asset, i) => (
                      <motion.div key={asset.id} initial={{ width: 0 }} animate={{ width: `${asset.percentage}%` }} transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="h-full" style={{ background: asset.color }} title={`${asset.name} - ${asset.percentage.toFixed(1)}%`} />
                    ))}
                  </div>
                  <div className="space-y-4">
                    {assets.map((asset, i) => (
                      <motion.div key={asset.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: asset.color }} />
                          <span className="text-sm text-carbon font-medium group-hover:text-saffron transition-colors">{asset.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-geist-pixel text-stone">₹{(asset.value / 100000).toFixed(1)}L</span>
                          <span className="text-xs font-bold text-carbon w-12 text-right">{asset.percentage.toFixed(1)}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-[#FAFAFA] p-8 border border-carbon/5">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Target vs Actual</h3>
              <div className="space-y-6">
                {allocationTable.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-carbon font-medium capitalize">{item.name.replace(/_/g, " ")}</span>
                      <span className={cn("font-geist-pixel", Math.abs(item.actualPct - item.targetPct) > 5 ? "text-red-500" : "text-stone")}>{item.actualPct.toFixed(0)}% / {item.targetPct.toFixed(0)}%</span>
                    </div>
                    <div className="relative h-1.5 bg-carbon/5 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-carbon/20" style={{ width: `${item.targetPct}%` }} />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${item.actualPct}%` }} transition={{ duration: 1, delay: 0.5 }} className={cn("absolute top-0 left-0 h-full", Math.abs(item.actualPct - item.targetPct) > 5 ? "bg-saffron" : "bg-carbon")} />
                    </div>
                  </div>
                ))}
              </div>
              {data?.insight && (
                <div className="mt-8 p-4 border border-saffron/20 bg-saffron/5">
                  <p className="text-xs text-carbon-light leading-relaxed">
                    <span className="font-bold text-saffron">Insight:</span> {data.insight}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center justify-center py-20 text-center">
            <Activity className="w-12 h-12 text-stone-light mb-6" />
            <h2 className="text-xl font-medium text-carbon mb-2">Performance Metrics</h2>
            <p className="text-sm text-stone max-w-md">Detailed performance tracking with IRR analysis and benchmark comparisons.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
