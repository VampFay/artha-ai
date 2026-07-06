import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ArrowDownRight, ArrowUpRight, CreditCard, Wallet } from 'lucide-react';
import { KineticNumber } from '../components/ui/KineticNumber';

export default function CashflowView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions'>('overview');

  const EXPENSES = [
    { category: 'Housing & Rent', amount: 85000, trend: '+0%' },
    { category: 'Food & Dining', amount: 32000, trend: '+12%' },
    { category: 'Travel & Transport', amount: 18000, trend: '-5%' },
    { category: 'Shopping', amount: 45000, trend: '+28%' },
    { category: 'Utilities & Bills', amount: 12000, trend: '+2%' },
  ];

  const SUBSCRIPTIONS = [
    { name: 'Netflix Premium', amount: 649, frequency: 'Monthly', status: 'Active' },
    { name: 'AWS Cloud', amount: 3200, frequency: 'Monthly', status: 'Active' },
    { name: 'Gym Membership', amount: 2500, frequency: 'Monthly', status: 'Active' },
    { name: 'Amazon Prime', amount: 1499, frequency: 'Yearly', status: 'Active' },
    { name: 'Adobe Creative Cloud', amount: 4200, frequency: 'Monthly', status: 'Active' },
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
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Cashflow & Liquidity</span>
        </motion.div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon mb-2">
              <span className="font-serif italic text-stone text-3xl md:text-5xl mr-2">₹</span>
              <KineticNumber value={285000} />
            </h1>
            <p className="text-xs font-mono text-stone-dark flex items-center gap-2">
              <span className="text-carbon font-medium">Monthly Free Cash Flow</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'overview' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('subscriptions')}
              className={cn(
                "text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-2 transition-colors",
                activeTab === 'subscriptions' ? "border-carbon text-carbon" : "border-transparent text-stone hover:text-carbon"
              )}
            >
              Subscriptions
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-8">Income vs Expenses (YTD)</h3>
              <div className="h-48 flex items-end gap-4">
                {[45, 60, 55, 75, 65, 80].map((val, i) => (
                  <div key={`inc-${i}`} className="flex-1 flex gap-1 items-end h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="w-1/2 bg-carbon"
                    />
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 0.6}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.1 }}
                      className="w-1/2 bg-stone-light"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold tracking-[0.15em] text-stone uppercase">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Top Expenses This Month</h3>
              <div className="space-y-4">
                {EXPENSES.map((exp, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-carbon/5">
                    <span className="text-sm font-medium text-carbon">{exp.category}</span>
                    <div className="flex items-center gap-6">
                      <span className={cn(
                        "text-xs font-mono",
                        exp.trend.startsWith('+') && exp.trend !== '+0%' ? "text-red-500" : "text-green-600"
                      )}>
                        {exp.trend}
                      </span>
                      <span className="text-sm font-mono text-carbon">₹{exp.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="p-8 border border-carbon/5 bg-carbon text-white">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-stone uppercase mb-6">Liquidity Runway</h3>
              <div className="text-4xl font-light mb-2">8.5 <span className="text-xl text-stone">Months</span></div>
              <p className="text-xs text-stone leading-relaxed">
                Based on your current average monthly burn rate of ₹1.9L and liquid assets of ₹16L.
              </p>
            </div>
            
            <div className="p-8 border border-carbon/5 bg-[#FAFAFA]">
              <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase mb-6">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-carbon/10">
                  <span className="text-sm text-stone">Savings Rate</span>
                  <span className="text-sm font-mono text-carbon font-medium">42%</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-carbon/10">
                  <span className="text-sm text-stone">Fixed Expenses</span>
                  <span className="text-sm font-mono text-carbon font-medium">₹1.1L</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-carbon/10">
                  <span className="text-sm text-stone">Discretionary</span>
                  <span className="text-sm font-mono text-carbon font-medium">₹85K</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-[10px] font-bold tracking-[0.15em] text-carbon uppercase">Active Subscriptions</h3>
            <div className="text-right">
              <div className="text-sm font-mono text-carbon font-medium">₹12,048</div>
              <div className="text-[10px] font-serif italic text-stone">Total Monthly Run Rate</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUBSCRIPTIONS.map((sub, i) => (
              <div key={i} className="p-6 border border-carbon/10 bg-[#FAFAFA] hover:border-carbon/30 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-8 h-8 rounded-full bg-carbon/5 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-carbon" />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider text-saffron uppercase">{sub.status}</span>
                </div>
                <h4 className="text-sm font-medium text-carbon mb-1">{sub.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-mono text-carbon">₹{sub.amount}</span>
                  <span className="text-xs text-stone">/ {sub.frequency.toLowerCase()}</span>
                </div>
              </div>
            ))}
            
            <div className="p-6 border border-dashed border-carbon/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-carbon/5 transition-colors">
              <div className="w-8 h-8 rounded-full border border-carbon/20 flex items-center justify-center mb-3">
                <span className="text-carbon">+</span>
              </div>
              <span className="text-xs font-medium text-carbon">Add Subscription</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
