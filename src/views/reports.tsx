"use client";
import { useState } from "react";
import { formatDateTime } from "@/lib/format";
import { FileText, TrendingUp, Target, Download, Loader2, Check } from "lucide-react";
const { useToast } = require("@/hooks/use-toast");
export default function ReportsContent() {
  const [reports, setReports] = useState<{ id: string; report_type: string; generated_at: string }[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const { toast } = useToast();
  const handleGenerate = async (type: string) => { setGenerating(type); try { const res = await fetch(`/api/reports?type=${type}`, { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } }); if (!res.ok) throw new Error(); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${type}_report.pdf`; a.click(); URL.revokeObjectURL(url); toast({ title: "PDF generated!" }); setReports(r => [{ id: `r_${Date.now()}`, report_type: type, generated_at: new Date().toISOString() }, ...r]); } catch { toast({ title: "Failed", variant: "destructive" }); } finally { setGenerating(null); } };
  const types = [{ type: "tax_summary", icon: FileText, title: "Tax Summary", desc: "Income, deductions, regime comparison." }, { type: "finance_health", icon: TrendingUp, title: "Financial Health", desc: "Score, metrics, top categories." }, { type: "goal_simulation", icon: Target, title: "Goal Simulation", desc: "Projection, shortfall, scenarios." }];
  const lastGen = (t: string) => reports.find(r => r.report_type === t);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">Export</p><h1 className="text-heading">Reports</h1></div>
      <div className="grid md:grid-cols-3 gap-4">
        {types.map((r, i) => { const Icon = r.icon; const last = lastGen(r.type); return (
          <div key={r.type} className="bento bento-light p-6 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(13,59,46,0.06)" }}><Icon className="h-5 w-5" style={{ color: "var(--color-forest)" }} /></div>
            <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--color-ink)" }}>{r.title}</h3>
            <p className="text-xs mb-3" style={{ color: "var(--color-ink-muted)" }}>{r.desc}</p>
            <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: last ? "var(--color-forest)" : "var(--color-ink-muted)" }}>{last ? <span className="flex items-center gap-1"><Check className="h-3 w-3" />{formatDateTime(last.generated_at)}</span> : "Not generated"}</p>
            <button onClick={() => handleGenerate(r.type)} disabled={generating === r.type} className="w-full h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all duration-200" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>{generating === r.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Download className="h-3.5 w-3.5" />Generate PDF</>}</button>
          </div> ); })}
      </div>
    </div>
  );
}
