"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, FileText } from "lucide-react";

export default function EntityTDSReturnsView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const { toast } = useToast();
  const entityId = params.entity_id || activeEntityId;
  const [returnType, setReturnType] = useState<"24q" | "26q">("24q");
  const [assessmentYear, setAssessmentYear] = useState("2024-25");
  const [quarter, setQuarter] = useState("Q1");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!entityId) return;
    setGenerating(true);
    setResult(null);
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch(`/api/entities/${entityId}/tds-returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: returnType, assessmentYear, quarter }),
      });
      if (!res.ok) throw new Error("Failed to generate TDS return");
      const data = await res.json();
      setResult(data.data);
      toast({ title: "TDS Return Generated", description: data.data.filename });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[900px] mx-auto w-full">
      <div className="mb-8">
        <button onClick={() => navigate("entity-dashboard", { entity_id: entityId || "" })} className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors">← Dashboard</button>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-saffron" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">TDS Returns</h1>
        </div>
        <p className="text-stone text-sm">Generate Form 24Q (salary) and 26Q (non-salary) JSON for TRACES upload</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => setReturnType("24q")} className={`p-4 rounded-xl border-2 text-left transition-all ${returnType === "24q" ? "border-saffron bg-saffron/5" : "border-carbon/10 hover:border-carbon/20"}`}>
          <FileText className="w-5 h-5 text-saffron mb-2" />
          <h3 className="text-sm font-medium text-carbon">Form 24Q</h3>
          <p className="text-[11px] text-stone mt-1">Salary TDS — quarterly</p>
        </button>
        <button onClick={() => setReturnType("26q")} className={`p-4 rounded-xl border-2 text-left transition-all ${returnType === "26q" ? "border-saffron bg-saffron/5" : "border-carbon/10 hover:border-carbon/20"}`}>
          <FileText className="w-5 h-5 text-saffron mb-2" />
          <h3 className="text-sm font-medium text-carbon">Form 26Q</h3>
          <p className="text-[11px] text-stone mt-1">Non-salary TDS — quarterly</p>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-2">Assessment Year</label>
          <select value={assessmentYear} onChange={(e) => setAssessmentYear(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron">
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
            <option value="2023-24">2023-24</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-2">Quarter</label>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron">
            <option value="Q1">Q1 (Apr-Jun)</option>
            <option value="Q2">Q2 (Jul-Sep)</option>
            <option value="Q3">Q3 (Oct-Dec)</option>
            <option value="Q4">Q4 (Jan-Mar)</option>
          </select>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={generating} className="w-full px-6 py-3 bg-saffron text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 flex items-center justify-center gap-2">
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {generating ? "Generating..." : "Generate TDS Return JSON"}
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-carbon/10 rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-carbon">Generation Complete</h3>
              <p className="text-[10px] text-stone uppercase tracking-wider mt-1">{result.filename}</p>
            </div>
            <button onClick={handleDownload} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 flex items-center gap-2">
              <FileDown className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.summary && Object.entries(result.summary).map(([key, val]: [string, any]) => (
              <div key={key} className="p-3 bg-carbon/5 rounded-lg">
                <p className="text-[9px] font-bold text-stone uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                <p className="text-sm text-carbon font-medium mt-1">{typeof val === "number" ? val.toLocaleString("en-IN") : typeof val === "object" ? JSON.stringify(val).substring(0, 50) : String(val)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[11px] text-blue-700">💡 Upload this JSON to <a href="https://www.tdscpc.gov.in" target="_blank" rel="noopener" className="underline font-medium">TRACES</a> under Returns → Upload</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
