"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";
import { FileText, TrendingUp, Target, Download, Loader2, Check } from "lucide-react";
export default function ReportsContent() {
  const [reports, setReports] = useState<{ id: string; report_type: string; generated_at: string }[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const handleGenerate = async (type: string) => {
    setGenerating(type);
    try {
      const res = await fetch(`/api/reports?type=${type}`, { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Failed"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${type}_report.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF report generated & downloaded!" });
      setReports((r) => [{ id: `r_${Date.now()}`, report_type: type, generated_at: new Date().toISOString() }, ...r]);
    } catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
    finally { setGenerating(null); }
  };
  const reportTypes = [
    { type: "tax_summary", icon: FileText, title: "CA-Ready Tax Summary", desc: "Income, deductions, regime comparison, missing docs." },
    { type: "finance_health", icon: TrendingUp, title: "Financial Health Report", desc: "Score, metrics, top categories, suggestions." },
    { type: "goal_simulation", icon: Target, title: "Goal Simulation Report", desc: "Goal details, projection, shortfall." },
  ];
  const lastGenerated = (type: string) => reports.find((r) => r.report_type === type);
  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1><p className="text-sm text-slate-400 mt-0.5">Generate downloadable PDF reports.</p></div>
      <div className="grid md:grid-cols-3 gap-4">
        {reportTypes.map((r, i) => { const Icon = r.icon; const last = lastGenerated(r.type); return (
          <div key={r.type} className="glass rounded-2xl p-5 card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3"><Icon className="h-5 w-5 text-emerald-600" /></div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{r.title}</h3>
            <p className="text-xs text-slate-400 mb-3">{r.desc}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3">{last ? <span className="text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" />Last: {formatDateTime(last.generated_at)}</span> : "Not generated yet"}</p>
            <Button size="sm" onClick={() => handleGenerate(r.type)} disabled={generating === r.type} className="bg-emerald-500 hover:bg-emerald-600 w-full">{generating === r.type ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Generating PDF...</> : <><Download className="h-3.5 w-3.5 mr-1" />Generate PDF</>}</Button>
          </div> ); })}
      </div>
    </div>
  );
}
