"use client";
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { KineticNumber } from '@/components/ui/KineticNumber';
import { Landmark, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LiabilitiesView() {
  const LOANS = [
    { 
      name: 'Home Loan (HDFC)', 
      principal: 12500000, 
      remaining: 9800000, 
      rate: 8.5, 
      emi: 108400, 
      tenureLeft: 184 // months
    },
    { 
      name: 'Car Loan (SBI)', 
      principal: 1500000, 
      remaining: 650000, 
      rate: 9.2, 
      emi: 31500, 
      tenureLeft: 22 
    },
  ];

  const totalDebt = LOANS.reduce((acc, loan) => acc + loan.remaining, 0);
  const totalEmi = LOANS.reduce((acc, loan) => acc + loan.emi, 0);

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto w-full">
      <div className="py-12 md:py-20 border-b border-carbon/10 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Debt Management</span>
        </motion.div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2">
              Liabilities
            </h1>
            <p className="text-sm text-stone max-w-xl">
              Track your outstanding loans, EMIs, and explore prepayment strategies to become debt-free faster.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-8"
        >
          <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Active Loans</h3>
          
          <div className="space-y-6">
            {LOANS.map((loan, i) => (
              <div key={i} className="p-6 md:p-8 border border-carbon/10 bg-[#FAFAFA] group hover:border-carbon/30 transition-all">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-carbon/5 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-carbon" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-carbon">{loan.name}</h4>
                      <p className="text-xs text-stone">{loan.rate}% Interest Rate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono text-carbon">₹{loan.remaining.toLocaleString()}</div>
                    <div className="text-[10px] text-stone uppercase tracking-wider">Remaining</div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] text-stone uppercase tracking-wider mb-2">
                    <span>Principal Paid</span>
                    <span>₹{(loan.principal - loan.remaining).toLocaleString()}</span>
                  </div>
                  <div className="relative h-1.5 bg-carbon/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((loan.principal - loan.remaining) / loan.principal) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className="absolute top-0 left-0 h-full bg-carbon"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-carbon/5">
                  <div>
                    <span className="block text-[10px] text-stone uppercase tracking-wider mb-1">Monthly EMI</span>
                    <span className="font-mono text-sm text-carbon">₹{loan.emi.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-stone uppercase tracking-wider mb-1">Tenure Left</span>
                    <span className="font-mono text-sm text-carbon">{Math.floor(loan.tenureLeft / 12)}y {loan.tenureLeft % 12}m</span>
                  </div>
                  <div className="md:col-span-2 flex justify-end items-center">
                    <button className="text-xs text-carbon font-medium hover:text-saffron transition-colors flex items-center gap-1">
                      Prepayment Options <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="p-8 bg-carbon text-white">
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-6">Total Debt Burden</h3>
            <div className="text-3xl font-light mb-1">
              <span className="font-serif italic text-stone mr-1">₹</span>
              <KineticNumber value={totalDebt} />
            </div>
            <p className="text-xs text-stone mt-4 mb-6">
              Total Monthly EMI outflow: <span className="text-white font-mono">₹{totalEmi.toLocaleString()}</span>
            </p>
            
            <div className="pt-6 border-t border-white/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-stone">Debt-to-Income Ratio</span>
                <span className="text-xs font-medium text-white">35%</span>
              </div>
              <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-saffron w-[35%]" />
              </div>
              <p className="text-[10px] text-stone mt-2">Optimal ratio is below 36%.</p>
            </div>
          </div>
          
          <div className="p-8 border border-saffron/20 bg-saffron/5">
            <ShieldAlert className="w-6 h-6 text-saffron mb-4" />
            <h3 className="text-sm font-medium text-carbon mb-2">Prepayment Insight</h3>
            <p className="text-xs text-carbon-light leading-relaxed mb-4">
              Making one extra EMI payment of ₹1,08,400 this year on your Home Loan will save you approximately ₹6,45,000 in interest over the loan tenure.
            </p>
            <button className="text-xs text-saffron font-bold uppercase tracking-wider hover:text-carbon transition-colors">
              Simulate Prepayment
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
