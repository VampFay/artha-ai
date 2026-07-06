"use client";
import { useState } from "react";
import { FileText, TrendingUp, Target, Download, FileCheck, Loader2 } from "lucide-react";

const REPORTS = [
  { id: "tax_summary", icon: FileText, title: "Tax Summary", desc: "Income, deductions, regime comparison, missing documents" },
  { id: "finance_health", icon: TrendingUp, title: "Financial Health", desc: "Score, metrics, top categories, suggestions" },
  { id: "goal_simulation", icon: Target, title: "Goal Simulation", desc: "Projection, shortfall, multi-scenario comparison" },
];

interface GenRecord { id: string; type: string; filename: string; generatedAt: string; }

export default function ReportsView() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [records, setRecords] = useState<GenRecord[]>([]);

  const handleGenerate = async (id: string) => {
    setGenerating(id);
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch(`/api/reports?type=${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}_report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setRecords(prev => [{ id: `r_${Date.now()}`, type: id, filename: `${id}_report.pdf`, generatedAt: new Date().toISOString() }, ...prev]);
    } catch {}
    setGenerating(null);
  };

  return (
    <div className="flex flex-col">
      <div className="px-8 lg:px-12 pt-8 max-w-5xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Reports</h1>
          <p className="text-stone">Generate CA-ready PDF reports from your analyzed data.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {REPORTS.map(rep => {
            const lastGen = records.find(r => r.type === rep.id);
            return (
              <div key={rep.id} className="bg-white rounded-3xl p-6 border border-stone/10 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-stone/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                    <rep.icon className="w-6 h-6 text-carbon" />
                  </div>
                  <h3 className="font-semibold text-carbon text-lg mb-2">{rep.title}</h3>
                  <p className="text-sm text-stone leading-relaxed mb-6 h-12">{rep.desc}</p>
                  <div className="text-xs font-semibold text-stone uppercase tracking-wider mb-6">
                    {lastGen ? `Last: ${new Date(lastGen.generatedAt).toLocaleDateString("en-IN")}` : "Not generated"}
                  </div>
                </div>
                <button onClick={() => handleGenerate(rep.id)} disabled={generating !== null} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-carbon text-canvas font-medium transition-colors hover:bg-carbon-light disabled:bg-stone/10 disabled:text-stone">
                  {generating === rep.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {generating === rep.id ? "Generating..." : "Generate PDF"}
                </button>
              </div>
            );
          })}
        </div>

        {records.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <FileCheck className="w-5 h-5 text-saffron" />
              <h2 className="text-lg font-semibold text-carbon">Recent Generations</h2>
            </div>
            <div className="bg-white rounded-2xl border border-stone/10 overflow-hidden">
              {records.slice(0, 6).map(rec => (
                <div key={rec.id} className="flex items-center justify-between p-4 border-b border-stone/10 last:border-0 hover:bg-stone/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-stone/50" />
                    <div>
                      <p className="font-medium text-carbon text-sm capitalize">{rec.type.replace(/_/g, " ")} Report</p>
                      <p className="text-xs text-stone">{new Date(rec.generatedAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <button className="p-2 text-stone hover:text-carbon transition-colors"><Download className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
