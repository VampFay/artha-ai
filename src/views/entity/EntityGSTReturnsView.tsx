"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, FileText, Calendar, Building2, AlertCircle } from "lucide-react";

export default function EntityGSTReturnsView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const { toast } = useToast();
  const entityId = params.entity_id || activeEntityId;
  const [returnType, setReturnType] = useState<"gstr1" | "gstr3b">("gstr1");
  const [period, setPeriod] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const defaultPeriod = `${String(currentMonth).padStart(2, "0")}${currentYear}`;

  const handleGenerate = async () => {
    if (!entityId) return;
    setGenerating(true);
    setResult(null);
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch(`/api/entities/${entityId}/gst-returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: returnType, period: period || defaultPeriod }),
      });
      if (!res.ok) throw new Error("Failed to generate GST return");
      const data = await res.json();
      setResult(data.data);
      toast({ title: "GST Return Generated", description: data.data.filename });
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
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">GST Returns</h1>
        </div>
        <p className="text-stone text-sm">Generate GSTR-1 and GSTR-3B JSON files for direct upload to GST portal</p>
      </div>

      {/* Return type selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setReturnType("gstr1")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${returnType === "gstr1" ? "border-saffron bg-saffron/5" : "border-carbon/10 hover:border-carbon/20"}`}
        >
          <FileText className="w-5 h-5 text-saffron mb-2" />
          <h3 className="text-sm font-medium text-carbon">GSTR-1</h3>
          <p className="text-[11px] text-stone mt-1">Outward supplies (sales) — monthly</p>
        </button>
        <button
          onClick={() => setReturnType("gstr3b")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${returnType === "gstr3b" ? "border-saffron bg-saffron/5" : "border-carbon/10 hover:border-carbon/20"}`}
        >
          <FileText className="w-5 h-5 text-saffron mb-2" />
          <h3 className="text-sm font-medium text-carbon">GSTR-3B</h3>
          <p className="text-[11px] text-stone mt-1">Monthly summary return with tax payment</p>
        </button>
      </div>

      {/* Period selector */}
      <div className="mb-6">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-2">Filing Period (MMYYYY)</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder={defaultPeriod}
            maxLength={6}
            className="flex-1 px-4 py-3 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 bg-saffron text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generating ? "Generating..." : "Generate JSON"}
          </button>
        </div>
        <p className="text-[10px] text-stone/60 mt-2">Enter the filing period as MMYYYY (e.g., 042024 for April 2024)</p>
      </div>

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-carbon/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-carbon">Generation Complete</h3>
              <p className="text-[10px] text-stone uppercase tracking-wider mt-1">{result.filename}</p>
            </div>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 flex items-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.summary && Object.entries(result.summary).map(([key, val]: [string, any]) => (
              <div key={key} className="p-3 bg-carbon/5 rounded-lg">
                <p className="text-[9px] font-bold text-stone uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                <p className="text-sm text-carbon font-medium mt-1">
                  {typeof val === "number" ? val.toLocaleString("en-IN") : String(val)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[11px] text-blue-700">
              💡 Upload this JSON file to the <a href="https://www.gst.gov.in" target="_blank" rel="noopener" className="underline font-medium">GST portal</a> under Returns → {returnType === "gstr1" ? "GSTR-1" : "GSTR-3B"} → Upload JSON
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
