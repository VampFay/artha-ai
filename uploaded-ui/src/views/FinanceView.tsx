import { useState } from 'react';
import { ViewState } from '../types';
import { KineticNumber } from '../components/ui/KineticNumber';
import { Sparkline } from '../components/ui/Sparkline';
import { GradientBars } from '../components/ui/GradientBars';
import { PiggyBank, CreditCard, Wallet, Bell, Zap, TrendingUp, Sparkles, TrendingDown } from 'lucide-react';

const SPENDING_DATA = [
  { label: 'Food & Dining', value: 24500, color: '#d97706' }, // Saffron
  { label: 'Rent & Utilities', value: 45000, color: '#6b6258' }, // Stone
  { label: 'Transportation', value: 8200, color: '#1a1a1a' }, // Carbon
  { label: 'Shopping', value: 12400, color: '#f59e0b' },
  { label: 'Subscriptions', value: 3100, color: '#b91c1c' }, // Crimson
];

export default function FinanceView() {
  const [emergencyFund, setEmergencyFund] = useState(300000);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full">
        
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Financial Health</h1>
            <p className="text-stone">Your money flow and overall financial stability.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-stone/10 shadow-sm">
            <span className="text-sm font-medium text-stone">Target Emergency Fund</span>
            <div className="flex items-center gap-1 font-semibold text-carbon">
              <span>₹</span>
              <input 
                type="number" 
                value={emergencyFund} 
                onChange={e => setEmergencyFund(Number(e.target.value))}
                className="w-24 bg-transparent outline-none focus:ring-2 focus:ring-saffron/50 rounded"
              />
            </div>
          </div>
        </header>

        {/* Hero Card */}
        <section className="bg-carbon text-canvas rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="flex items-center gap-8">
            <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" className="stroke-white/10" strokeWidth="6" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" 
                  className="stroke-saffron drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]" 
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray="283" strokeDashoffset={283 - (72/100)*283}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <KineticNumber value={72} className="text-3xl font-semibold tracking-tighter" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white mb-1">Good</h2>
              <p className="text-stone text-sm max-w-xs">Your financial health is stable. Focus on reducing debt to improve your score.</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-stone mb-2 font-medium uppercase tracking-wider">6-Month Savings Trend</p>
            <Sparkline data={[20, 22, 18, 25, 24, 28]} width={200} height={40} color="#d97706" />
          </div>
        </section>

        {/* 4 Metric Mini-Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Savings Rate', val: '28%', icon: PiggyBank, color: 'text-emerald-600', bg: 'bg-emerald-50', spark: [20, 22, 18, 25, 24, 28] },
            { label: 'D/I Ratio', val: '32%', icon: CreditCard, color: 'text-crimson', bg: 'bg-crimson/10', spark: [35, 34, 34, 33, 32, 32] },
            { label: 'Emergency', val: '4.2 mo', icon: Wallet, color: 'text-saffron', bg: 'bg-saffron/10', spark: [3.8, 3.8, 3.9, 4.0, 4.1, 4.2] },
            { label: 'Subscriptions', val: '₹3,100', icon: Bell, color: 'text-indigo-600', bg: 'bg-indigo-50', spark: [2800, 2800, 3100, 3100, 3100, 3100] },
          ].map(metric => (
            <div key={metric.label} className="bg-white rounded-2xl p-5 border border-stone/10 shadow-sm flex flex-col justify-between h-36">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-full ${metric.bg} flex items-center justify-center shrink-0`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
                <span className="text-sm font-medium text-stone truncate">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-carbon">{metric.val}</span>
                <Sparkline data={metric.spark} width={60} height={20} color="#1a1a1a" className="opacity-20" />
              </div>
            </div>
          ))}
        </section>

        {/* Charts & Suggestions */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          <div className="md:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-stone/10 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-semibold text-carbon text-lg">Spending by Category</h3>
                <div className="px-3 py-1 rounded-full bg-stone/5 text-xs font-medium text-stone">This Month</div>
              </div>
              <GradientBars data={SPENDING_DATA} formatValue={v => `₹${v.toLocaleString('en-IN')}`} />
            </div>
          </div>

          <div className="md:col-span-5 space-y-6">
            <div className="bg-[#faf5ef] rounded-3xl p-8 border border-[#f0e6d5]">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-saffron" />
                <h3 className="font-semibold text-[#4a3f35] text-lg">AI Suggestions</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  "Your Debt-to-Income ratio (32%) is slightly high. Consider consolidating your personal loan.",
                  "You have 4.2 months of emergency funds. Great job, keep pushing towards 6 months.",
                  "Your subscription spending increased by ₹300 this month. Review your active services."
                ].map((sug, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-stone/10 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-saffron/10 text-saffron flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-carbon font-medium leading-relaxed">{sug}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
