"use client";
import { useState } from 'react';
import { Target, Plus, Trash2, ArrowRight, TrendingUp } from 'lucide-react';
import { KineticNumber } from '@/components/ui/KineticNumber';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const INITIAL_GOALS = [
  { id: '1', name: 'House Down Payment', target: 1500000, saved: 450000, monthly: 25000, date: '2026-12-01' },
  { id: '2', name: 'Emergency Fund', target: 300000, saved: 280000, monthly: 10000, date: '2024-10-01' },
];

export default function GoalsView() {
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-12 pb-12 max-w-[1200px] mx-auto w-full">
      <div className="py-12 md:py-20 border-b border-carbon/10 mb-12 flex justify-between items-end">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Simulations & Planning</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-light tracking-tight text-carbon">Goal Simulations</h1>
        </div>
        
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 px-6 py-3 bg-carbon text-white text-[10px] font-bold tracking-widest uppercase hover:bg-carbon/90 transition-colors shadow-xl"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-12"
          >
            <div className="bg-[#1a1a1a] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-end shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full blur-2xl" />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full relative z-10">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-stone uppercase">Goal Objective</label>
                  <input type="text" placeholder="e.g. Vacation" className="bg-transparent border-b border-white/20 text-white placeholder-stone outline-none pb-2 font-serif text-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-stone uppercase">Target Amount</label>
                  <input type="number" placeholder="₹" className="bg-transparent border-b border-white/20 text-white placeholder-stone outline-none pb-2 font-mono text-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-stone uppercase">Monthly SIP</label>
                  <input type="number" placeholder="₹" className="bg-transparent border-b border-white/20 text-white placeholder-stone outline-none pb-2 font-mono text-xl" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-stone uppercase">Target Date</label>
                  <input type="date" className="bg-transparent border-b border-white/20 text-stone outline-none pb-2 font-mono text-lg" />
                </div>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="px-8 py-4 bg-saffron text-carbon text-[10px] font-bold tracking-widest uppercase shrink-0 transition-transform hover:scale-105 active:scale-95 z-10"
              >
                Initialize
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.map((goal, i) => {
          const progress = (goal.saved / goal.target) * 100;
          return (
            <motion.div 
              key={goal.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-canvas border border-carbon/10 p-8 md:p-10 flex flex-col justify-between group relative overflow-hidden"
            >
              <button 
                onClick={() => setGoals(g => g.filter(x => x.id !== goal.id))}
                className="absolute top-8 right-8 text-stone hover:text-red-500 transition-colors z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="mb-12">
                <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-4">{goal.name}</h3>
                
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-serif text-carbon">₹</span>
                  <KineticNumber value={goal.saved} className="text-4xl md:text-5xl font-serif text-carbon tracking-tight" />
                </div>
                <p className="text-xs font-mono text-stone-dark">
                  Target: ₹{goal.target.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-bold tracking-widest text-carbon uppercase">Progress Status</span>
                  <span className="font-mono text-saffron text-sm">{Math.round(progress)}%</span>
                </div>
                <div className="h-1 bg-carbon/5 w-full relative mb-8">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-0 left-0 h-full bg-carbon"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-carbon/10 pt-6">
                  <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold tracking-widest uppercase">
                    <TrendingUp className="w-3 h-3" />
                    <span>On Track</span>
                  </div>
                  <div className="text-[10px] font-mono text-stone uppercase text-right">
                    ETA: {new Date(goal.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
