import { useState } from 'react';
import { FileText, TrendingUp, Target, Download, FileCheck, Loader2 } from 'lucide-react';

const REPORTS = [
  { id: 'tax', icon: FileText, title: 'Tax Summary', desc: 'Income, deductions, regime comparison, missing documents', lastGen: 'Just now' },
  { id: 'health', icon: TrendingUp, title: 'Financial Health', desc: 'Score, metrics, top categories, suggestions', lastGen: '2 days ago' },
  { id: 'goal', icon: Target, title: 'Goal Simulation', desc: 'Projection, shortfall, multi-scenario comparison', lastGen: 'Not generated' },
];

export default function ReportsView() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full">
        
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Reports</h1>
          <p className="text-stone">Generate CA-ready PDF reports from your analyzed data.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {REPORTS.map(rep => (
            <div key={rep.id} className="bg-white rounded-3xl p-6 border border-stone/10 shadow-sm flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-stone/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                  <rep.icon className="w-6 h-6 text-carbon" />
                </div>
                <h3 className="font-semibold text-carbon text-lg mb-2">{rep.title}</h3>
                <p className="text-sm text-stone leading-relaxed mb-6 h-12">{rep.desc}</p>
                <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-6">
                  {rep.lastGen !== 'Not generated' ? `Last generated: ${rep.lastGen}` : rep.lastGen}
                </div>
              </div>
              <button 
                onClick={() => handleGenerate(rep.id)}
                disabled={generating !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-carbon text-canvas font-medium transition-colors hover:bg-carbon-light disabled:bg-stone/10 disabled:text-stone"
              >
                {generating === rep.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {generating === rep.id ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="w-5 h-5 text-saffron" />
            <h2 className="text-lg font-semibold text-carbon">Recent Generations</h2>
          </div>
          <div className="bg-white rounded-2xl border border-stone/10 overflow-hidden">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-stone/10 last:border-0 hover:bg-stone/5 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-stone/50" />
                  <div>
                    <p className="font-medium text-carbon text-sm">Tax Summary FY24-25.pdf</p>
                    <p className="text-xs text-stone">{i === 0 ? 'Just now' : `${i+1} days ago`} · 1.2 MB</p>
                  </div>
                </div>
                <button className="p-2 text-stone hover:text-carbon transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
