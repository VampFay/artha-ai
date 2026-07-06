"use client";
import { motion } from 'motion/react';
import { ViewState } from '@/lib/types';
import { LiquidProgress } from '@/components/ui/LiquidProgress';
import { KineticNumber } from '@/components/ui/KineticNumber';
import { CheckCircle2, TrendingDown, FileWarning, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TaxView() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Tax Readiness</h1>
          <p className="text-stone">AI-driven analysis of your tax profile for FY 2024-25.</p>
        </header>

        {/* Hero Card */}
        <section className="bg-carbon text-canvas rounded-3xl p-8 mb-8 relative overflow-hidden border border-carbon-light">
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            {/* Circular Gauge */}
            <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-white/10" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" 
                  className="stroke-saffron drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" 
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="283" strokeDashoffset="42" // 85%
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 42 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <KineticNumber value={85} className="text-4xl font-semibold tracking-tighter" />
                <span className="text-stone font-medium text-sm">Score</span>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="flex-1 w-full space-y-5">
              <h3 className="text-lg font-medium text-white/90 mb-2">Readiness Breakdown</h3>
              {[
                { label: 'Document Completeness', val: 35, max: 40 },
                { label: 'Data Verification', val: 25, max: 25 },
                { label: 'Income Consistency', val: 15, max: 20 },
                { label: 'Deduction Proofs', val: 10, max: 15 },
              ].map((item, i) => (
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

        {/* Missing Documents Callout */}
        <section className="mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1">
              <FileWarning className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-amber-900">Missing Document</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-800">High Impact</span>
              </div>
              <p className="text-amber-800/80 mb-3 text-sm">
                You have declared HRA deductions but haven't uploaded a rent receipt for Q4.
              </p>
              <button className="text-sm font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-4">
                Upload Rent Receipt
              </button>
            </div>
          </div>
        </section>

        {/* Regime Comparison */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-carbon mb-6">Regime Comparison</h2>
          
          {/* Savings Callout */}
          <div className="mb-6 bg-gradient-to-r from-saffron to-saffron-light rounded-2xl p-5 text-white flex items-center justify-between shadow-lg shadow-saffron/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/90 font-medium">Recommendation</p>
                <h3 className="text-xl font-semibold">Switch to New Regime</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/90 font-medium text-sm">Estimated Savings</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg">₹</span>
                <KineticNumber value={42500} format={v => v.toLocaleString('en-IN')} className="text-3xl font-bold tracking-tight" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Old Regime */}
            <div className="bg-white rounded-3xl p-8 border border-stone/10 shadow-sm relative overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
              <h3 className="text-lg font-medium text-stone mb-8">Old Regime</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Gross Income</span>
                  <span className="font-medium text-carbon">₹24,00,000</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Total Deductions</span>
                  <span className="font-medium text-emerald-600">-₹3,50,000</span>
                </div>
                <div className="h-px bg-stone/10 w-full" />
                <div className="flex justify-between items-center font-medium">
                  <span className="text-carbon">Taxable Income</span>
                  <span className="text-carbon">₹20,50,000</span>
                </div>
              </div>

              <div className="pt-6 border-t border-stone/10">
                <p className="text-sm font-medium text-stone mb-1">Total Tax Liability</p>
                <div className="flex items-baseline gap-1 text-carbon">
                  <span className="text-2xl font-medium">₹</span>
                  <span className="text-4xl font-semibold tracking-tight">4,44,600</span>
                </div>
              </div>
            </div>

            {/* New Regime (Recommended) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-saffron shadow-md relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-saffron text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Best Choice
              </div>
              
              <h3 className="text-lg font-semibold text-carbon mb-8">New Regime</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Gross Income</span>
                  <span className="font-medium text-carbon">₹24,00,000</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-stone">Standard Deduction</span>
                  <span className="font-medium text-emerald-600">-₹75,000</span>
                </div>
                <div className="h-px bg-stone/10 w-full" />
                <div className="flex justify-between items-center font-medium">
                  <span className="text-carbon">Taxable Income</span>
                  <span className="text-carbon">₹23,25,000</span>
                </div>
              </div>

              <div className="pt-6 border-t border-stone/10">
                <p className="text-sm font-medium text-stone mb-1">Total Tax Liability</p>
                <div className="flex items-baseline gap-1 text-carbon">
                  <span className="text-2xl font-medium">₹</span>
                  <span className="text-4xl font-semibold tracking-tight">4,02,100</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
