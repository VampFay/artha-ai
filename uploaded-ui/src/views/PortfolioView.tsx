import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { KineticNumber } from '../components/ui/KineticNumber';
import { ArrowUpRight, TrendingUp, PieChart, Activity } from 'lucide-react';

export default function PortfolioView() {
  const [activeTab, setActiveTab] = useState<'allocation' | 'performance'>('allocation');
  
  const ASSETS = [
    { name: 'Equities (Domestic)', value: 12500000, percentage: 45, color: 'bg-saffron' },
    { name: 'Equities (Global)', value: 4500000, percentage: 16, color: 'bg-saffron/70' },
    { name: 'Fixed Income', value: 6000000, percentage: 22, color: 'bg-stone-light' },
    { name: 'Real Estate', value: 4000000, percentage: 14, color: 'bg-[#222]' },
    { name: 'Cash & Equivalents', value: 800000, percentage: 3, color: 'bg-stone' },
  ];

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto w-full">
      <div className="py-12 md:py-20 border-b border-carbon/10 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Portfolio Overview</span>
        </motion.div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon mb-2">
              <span className="font-serif italic text-stone text-3xl md:text-5xl mr-2">₹</span>
              <KineticNumber value={27800000} />
            </h1>
            <p className="text-xs font-mono text-stone-dark flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-saffron" />
              <span className="text-saffron">+14.2%</span> IRR since inception
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('allocation')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'allocation' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Allocation
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'performance' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Performance
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'allocation' ? (
          <motion.div
            key="allocation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            <div>
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-8">Asset Distribution</h3>
              <div className="flex h-12 w-full rounded-sm overflow-hidden mb-8 gap-0.5">
                {ASSETS.map((asset, i) => (
                  <motion.div
                    key={i}
                    initial={{ width: 0 }}
                    animate={{ width: `${asset.percentage}%` }}
                    transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={cn("h-full", asset.color)}
                    title={`${asset.name} - ${asset.percentage}%`}
                  />
                ))}
              </div>
              
              <div className="space-y-4">
                {ASSETS.map((asset, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.05) }}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", asset.color)} />
                      <span className="text-sm text-carbon font-medium group-hover:text-saffron transition-colors">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-stone">
                        ₹{(asset.value / 100000).toFixed(1)}L
                      </span>
                      <span className="text-xs font-bold text-carbon w-8 text-right">{asset.percentage}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#FAFAFA] p-8 border border-carbon/5">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Target vs Actual</h3>
              <div className="space-y-6">
                {[
                  { name: 'Equity', actual: 61, target: 60 },
                  { name: 'Fixed Income', actual: 22, target: 30 },
                  { name: 'Real Estate', actual: 14, target: 10 },
                  { name: 'Cash', actual: 3, target: 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-carbon font-medium">{item.name}</span>
                      <span className={cn("font-mono", Math.abs(item.actual - item.target) > 5 ? "text-red-500" : "text-stone")}>
                        {item.actual}% / {item.target}%
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-carbon/5 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-carbon/20" style={{ width: `${item.target}%` }} />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.actual}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={cn("absolute top-0 left-0 h-full", Math.abs(item.actual - item.target) > 5 ? "bg-saffron" : "bg-carbon")}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 border border-saffron/20 bg-saffron/5">
                <p className="text-xs text-carbon-light leading-relaxed">
                  <span className="font-bold text-saffron">Insight:</span> Your fixed income allocation is 8% below target. Consider rebalancing during the next market high to lock in equity gains.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <Activity className="w-12 h-12 text-stone-light mb-6" />
            <h2 className="text-xl font-medium text-carbon mb-2">Performance Metrics</h2>
            <p className="text-sm text-stone max-w-md">
              Detailed historical performance charts and benchmark comparisons are being generated.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
