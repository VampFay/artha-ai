"use client";
import { useEffect, useState } from "react";
import { useNav } from "@/lib/nav-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, CheckCheck, Edit3 } from "lucide-react";
interface Field { id: string; field_name: string; field_value: string; confidence_score: number; verified_by_user: boolean; source_snippet: string | null; }
export default function DocumentVerifyContent() {
  const { params, navigate } = useNav();
  const docId = params.id as string;
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  useEffect(() => { if (!docId) return; const token = localStorage.getItem("finsight_token"); fetch(`/api/extraction/${docId}/fields`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { setFields(d.items || []); }).catch(() => setError("Failed")).finally(() => setLoading(false)); }, [docId]);
  const handleVerify = async (fieldId: string) => { const token = localStorage.getItem("finsight_token"); try { await fetch(`/api/extraction/${docId}/fields/${fieldId}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({}) }); setFields(fs => fs.map(f => f.id === fieldId ? { ...f, verified_by_user: true, confidence_score: 1.0 } : f)); toast({ title: "Field verified!" }); } catch { toast({ title: "Failed", variant: "destructive" }); } };
  const handleVerifyAll = async () => { const token = localStorage.getItem("finsight_token"); try { await fetch(`/api/extraction/${docId}/verify-all`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); setFields(fs => fs.map(f => ({ ...f, verified_by_user: true, confidence_score: 1.0 }))); toast({ title: "All fields verified!" }); } catch { toast({ title: "Failed", variant: "destructive" }); } };
  const handleEdit = async (fieldId: string) => { const token = localStorage.getItem("finsight_token"); try { await fetch(`/api/extraction/${docId}/fields/${fieldId}/verify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ value: editValue }) }); setFields(fs => fs.map(f => f.id === fieldId ? { ...f, field_value: editValue, verified_by_user: true, confidence_score: 1.0 } : f)); setEditingId(null); toast({ title: "Field updated & verified!" }); } catch { toast({ title: "Failed", variant: "destructive" }); } };
  if (loading) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3"><button onClick={() => navigate("documents")} className="p-1.5 rounded-lg hover:bg-slate-100"><ArrowLeft className="h-4 w-4 text-slate-400" /></button><div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Extracted Fields</h1><p className="text-sm text-slate-400 mt-0.5">Review and confirm AI-extracted data.</p></div></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {fields.length === 0 ? <div className="glass rounded-2xl p-12 text-center"><p className="text-lg font-medium text-slate-600">No fields extracted</p><p className="text-sm text-slate-400 mt-1">This document may not contain recognizable financial data.</p></div> : <><div className="flex justify-end"><Button onClick={handleVerifyAll} className="bg-emerald-500 hover:bg-emerald-600"><CheckCheck className="h-4 w-4 mr-1" />Verify All</Button></div><div className="glass rounded-2xl divide-y divide-slate-100">{fields.map((f) => <div key={f.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50"><div className="w-40 flex-shrink-0"><p className="text-sm font-medium text-slate-700 capitalize">{f.field_name.replace(/_/g, " ")}</p><Badge className={`mt-1 text-[10px] ${f.confidence_score >= 0.9 ? "bg-emerald-100 text-emerald-700" : f.confidence_score >= 0.7 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{Math.round(f.confidence_score * 100)}%</Badge></div><div className="flex-1">{editingId === f.id ? <div className="flex gap-2"><input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" autoFocus /><Button size="sm" onClick={() => handleEdit(f.id)} className="bg-emerald-500 hover:bg-emerald-600">Save</Button><Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button></div> : <p className={`text-sm font-mono ${f.verified_by_user ? "text-emerald-700" : "text-slate-900"}`}>{f.field_value}</p>}{f.source_snippet && !f.verified_by_user && <p className="text-xs text-slate-400 mt-1 italic truncate">Source: "{f.source_snippet}"</p>}</div><div className="flex items-center gap-2">{f.verified_by_user ? <Badge className="bg-emerald-100 text-emerald-700"><Check className="h-3 w-3 mr-0.5" />Verified</Badge> : <><button onClick={() => { setEditingId(f.id); setEditValue(f.field_value); }} className="p-1.5 rounded-lg hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5 text-slate-400" /></button><Button size="sm" variant="outline" onClick={() => handleVerify(f.id)}>Verify</Button></>}</div></div>)}</div></>}
    </div>
  );
}
