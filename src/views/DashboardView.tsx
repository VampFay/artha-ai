"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '@/lib/types';
import { cn } from '@/lib/utils';
import { KineticNumber } from '@/components/ui/KineticNumber';
import { ArrowUpRight, ArrowDownRight, CreditCard, Wallet, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    Promise.all([
      fetch("/api/portfolio/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/cashflow/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/cashflow/income-vs-expenses?months=6", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/tax/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/oracle/insight", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/estate/nominees", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([portfolio, cashflow, ie, tax, oracle, docs, estate]) => {
      setData({ portfolio, cashflow, ie, tax, oracle, docs, estate });
    });
  }, []);

  const netWorth = data.portfolio?.totalValue || 0;
  const liquidAmount = data.cashflow?.liquidAmount || 0;
  const lockedAmount = data.cashflow?.lockedAmount || 0;
  const runwayMonths = data.cashflow?.runwayMonths || 0;
  const totalAssets = liquidAmount + lockedAmount;
  const liquidPct = totalAssets > 0 ? (liquidAmount / totalAssets) * 100 : 0;
  const lockedPct = totalAssets > 0 ? (lockedAmount / totalAssets) * 100 : 0;
  const taxScore = data.tax?.score?.score ?? 0;
  const taxSavings = data.tax?.regime_comparison?.savings_amount ?? 0;
  const oracleText = data.oracle?.text || "Upload documents to receive personalized AI insights.";
  const docCount = data.docs?.items?.length || 0;
  const estateAction = data.estate?.audit?.unassignedAssetsCount > 0;

  const SPENDING_DATA = (data.ie?.items || []).map((d: any) => ({
    label: d.month.toUpperCase(),
    h: `${Math.max(10, (d.expense / Math.max(...(data.ie?.items || []).map((x: any) => x.expense), 1)) * 100)}%`,
    value: `₹${(d.expense / 100000).toFixed(1)}L`,
    category: d.expense > 100000 ? "High" : "Normal",
    color: 'bg-[#111]',
  }));

  return (
    <div className="flex flex-col px-6 lg:px-12 max-w-[1200px] mx-auto w-full">
      
      {/* Top Main Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Net Worth */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 lg:col-span-2 bg-[#1a1a1a] rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group cursor-pointer"
          onClick={() => onNavigate('portfolio')}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-saffron/20 transition-colors duration-700" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <h2 className="text-[10px] font-bold tracking-[0.2em] text-saffron uppercase">Total Net Worth</h2>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.4% YTD</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-michroma text-white/50">₹</span>
              <KineticNumber
                value={netWorth}
                className="text-[4rem] lg:text-[5.5rem] font-michroma tracking-tighter leading-none text-white"
              />
            </div>
          </div>
        </motion.div>

        {/* Liquid vs Locked */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-canvas border border-carbon/10 rounded-3xl p-8 flex flex-col justify-between"
        >
          <h2 className="text-[10px] font-bold tracking-[0.2em] text-carbon uppercase mb-8">Liquidity Profile</h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-stone uppercase tracking-wider">Liquid Assets</span>
                <span className="font-geist-pixel text-carbon">₹{(liquidAmount / 100000).toFixed(1)}L</span>
              </div>
              <div className="w-full h-1.5 bg-carbon/5 rounded-full overflow-hidden">
                <div className="h-full bg-saffron" style={{ width: `${liquidPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-stone uppercase tracking-wider">Locked (PF/RE)</span>
                <span className="font-geist-pixel text-carbon">₹{(lockedAmount / 10000000).toFixed(2)}Cr</span>
              </div>
              <div className="w-full h-1.5 bg-carbon/5 rounded-full overflow-hidden">
                <div className="h-full bg-carbon" style={{ width: `${lockedPct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-carbon/10 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-stone uppercase">Runway</span>
            <span className="font-michroma text-carbon">{runwayMonths.toFixed(0)} Months</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-16 gap-y-12">
        
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          
          {/* Quick Hub Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tax Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#f0ece5] rounded-3xl p-8 flex flex-col justify-between border border-carbon/5 cursor-pointer group hover:bg-[#e8e4dc] transition-colors"
              onClick={() => onNavigate('tax')}
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-carbon uppercase">Tax Readiness</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-michroma text-carbon tracking-tight"><KineticNumber value={taxScore} /></span>
                <span className="text-xl text-stone-dark font-michroma">/100</span>
              </div>
              <p className="text-xs text-stone leading-relaxed">
                Potential savings of <span className="font-bold text-carbon">₹{taxSavings.toLocaleString("en-IN")}</span> found.
              </p>
            </motion.div>

            {/* FIRE Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-canvas rounded-3xl p-8 flex flex-col justify-between border border-carbon/10 cursor-pointer group hover:border-carbon/20 transition-colors"
              onClick={() => onNavigate('retirement')}
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-carbon uppercase">FIRE Progress</h3>
                <TrendingUp className="w-4 h-4 text-stone" />
              </div>
              
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-michroma text-carbon tracking-tight">42</span>
                <span className="text-xl text-stone-dark font-michroma">%</span>
              </div>
              <p className="text-xs text-stone leading-relaxed">
                On track for retirement by <span className="font-bold text-carbon">Age 48</span>.
              </p>
            </motion.div>
          </div>

          {/* Spending Patterns */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            <div className="flex justify-between items-end mb-6 cursor-pointer group" onClick={() => onNavigate('cashflow')}>
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase group-hover:text-saffron transition-colors">Cashflow Patterns <ArrowUpRight className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
              <span className="text-[10px] font-michroma text-stone transition-colors">
                {hoveredBar !== null ? `Primary: ${SPENDING_DATA[hoveredBar].category}` : "Avg Outflow: ₹1.1L"}
              </span>
            </div>
            
            <div className="flex gap-2 items-end h-32 mt-6">
              {SPENDING_DATA.length === 0 ? (
                <div className="w-full text-center text-xs text-stone py-8">No spending data yet. Upload a bank statement to see patterns.</div>
              ) : SPENDING_DATA.map((bar, i) => (
                <div 
                  key={i} 
                  className="flex-1 flex flex-col justify-end items-center gap-3 h-full cursor-pointer relative"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  <AnimatePresence>
                    {hoveredBar === i && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                        className="absolute -top-10 bg-carbon text-white text-[10px] font-bold px-3 py-1.5 rounded flex items-center justify-center whitespace-nowrap shadow-xl z-10"
                      >
                        {bar.value}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-carbon" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ 
                      height: bar.h,
                      opacity: hoveredBar === null ? 1 : hoveredBar === i ? 1 : 0.3
                    }}
                    transition={{ 
                      height: { duration: 1, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] },
                      opacity: { duration: 0.2 }
                    }}
                    className={cn("w-full transition-shadow duration-300", bar.color, hoveredBar === i && "shadow-lg")}
                  />
                  <span className={cn(
                    "text-[9px] font-bold tracking-[0.2em] uppercase transition-colors",
                    hoveredBar === i ? "text-carbon" : "text-stone"
                  )}>{bar.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 flex flex-col gap-10">
          
          {/* Oracle Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            <div className="bg-[#111] rounded-3xl p-8 lg:p-10 flex-1 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse" />
                  <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-light uppercase">Artha Oracle Insight</h3>
                </div>
                
                <p className="font-michroma text-[22px] leading-[1.4] text-white mb-10">
                  "{oracleText}"
                </p>
              </div>
              
              <div className="flex flex-col gap-4 relative z-10">
                <button 
                  onClick={() => onNavigate('liabilities')}
                  className="w-full py-4 px-6 border border-stone/30 text-stone-light hover:bg-stone/10 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-between"
                >
                  <span>Analyze Subscriptions</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onNavigate('assistant')}
                  className="w-full py-4 px-6 bg-saffron text-[#111] hover:bg-saffron/90 text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center justify-between"
                >
                  <span>Ask Oracle</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Action Hub */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 gap-4"
          >
            <div 
              onClick={() => onNavigate('documents')}
              className="bg-canvas border border-carbon/10 p-6 rounded-2xl cursor-pointer hover:border-carbon/30 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-carbon/5 flex items-center justify-center mb-4 group-hover:bg-carbon group-hover:text-white transition-colors">
                <Wallet className="w-4 h-4" />
              </div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-carbon mb-1">Vault</h4>
              <p className="text-xs text-stone">{docCount} document{docCount !== 1 ? "s" : ""}</p>
            </div>

            <div
              onClick={() => onNavigate('estate')}
              className="bg-canvas border border-carbon/10 p-6 rounded-2xl cursor-pointer hover:border-carbon/30 transition-colors group"
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-4 transition-colors", estateAction ? "bg-red-500/10 text-red-600 group-hover:bg-red-600 group-hover:text-white" : "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white")}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-carbon mb-1">Estate</h4>
              <p className="text-xs text-stone">{estateAction ? "Action required" : "All clear"}</p>
            </div>
          </motion.div>
          
        </div>
        
      </div>
    </div>
  );
}
