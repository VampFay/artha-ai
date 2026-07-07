"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, CheckCheck, Edit3, ShieldCheck } from "lucide-react";

interface Field {
  id: string;
  field_name: string;
  field_value: string;
  confidence_score: number;
  verified_by_user: boolean;
  source_snippet: string | null;
}

export default function DocumentVerifyView() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    // Fetch fields for the most recent document
    fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const docs = d.items || [];
        if (docs.length === 0) { setLoading(false); return; }
        const latestDoc = docs[0];
        return fetch(`/api/extraction/${latestDoc.id}/fields`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r ? r.json() : { items: [] })
      .then(d => setFields(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  const verify = async (id: string) => {
    const token = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/extraction/placeholder/fields/${id}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({}) });
      setFields(fs => fs.map(f => f.id === id ? { ...f, verified_by_user: true, confidence_score: 1.0 } : f));
    } catch {}
  };

  if (loading) return (
    <div className="px-8 py-8 lg:px-12 max-w-5xl mx-auto">
      <div className="skeleton h-12 w-64 mb-8" />
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  return (
    <div className="flex flex-col px-8 py-8 lg:px-12 max-w-5xl mx-auto w-full pb-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-carbon mb-2">Verify Extracted Fields</h1>
        <p className="text-stone">Review and confirm the AI-extracted data from your documents.</p>
      </header>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-stone/10 rounded-3xl bg-white">
          <ShieldCheck className="w-12 h-12 text-stone-light mb-4" />
          <h2 className="text-xl font-medium text-carbon mb-2">No Fields to Verify</h2>
          <p className="text-sm text-stone max-w-md">Upload a document first to see extracted fields here for verification.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-carbon text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-carbon-light transition-colors">
              <CheckCheck className="w-4 h-4" /> Verify All
            </button>
          </div>
          <div className="bg-white border border-stone/10 rounded-2xl overflow-hidden">
            {fields.map((f, i) => (
              <div key={f.id} className={`flex items-start gap-4 p-6 ${i !== fields.length - 1 ? "border-b border-stone/10" : ""}`}>
                <div className="w-48 flex-shrink-0">
                  <p className="text-sm font-medium text-carbon capitalize">{f.field_name.replace(/_/g, " ")}</p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded mt-1 ${
                    f.confidence_score >= 0.9 ? "bg-emerald-50 text-emerald-700" :
                    f.confidence_score >= 0.7 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>
                    {Math.round(f.confidence_score * 100)}% confidence
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === f.id ? (
                    <div className="flex gap-2">
                      <input value={editValue} onChange={e => setEditValue(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 text-sm" autoFocus />
                      <button onClick={() => { setEditingId(null); verify(f.id); }} className="px-3 py-2 bg-carbon text-white text-xs font-bold rounded-lg">Save</button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-2 border border-stone/20 text-xs rounded-lg">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-geist-pixel text-carbon">{f.field_value}</p>
                      {f.source_snippet && !f.verified_by_user && <p className="text-xs text-stone mt-1 italic truncate">Source: "{f.source_snippet}"</p>}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {f.verified_by_user ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(f.id); setEditValue(f.field_value); }} className="p-2 text-stone hover:text-carbon hover:bg-stone/5 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => verify(f.id)} className="px-3 py-1.5 border border-stone/20 text-xs font-medium rounded-lg hover:bg-stone/5">Verify</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
