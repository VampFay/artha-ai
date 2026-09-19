"use client";
import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/app-layout";
import ProtectedRoute from "@/components/protected-route";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatBytes } from "@/lib/format";
import { UploadCloud, FileText, Trash2, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

const DOC_TYPES = [
  { value: "salary_slip", label: "Salary Slip" }, { value: "form16", label: "Form 16" },
  { value: "bank_statement", label: "Bank Statement" }, { value: "rent_receipt", label: "Rent Receipt" },
  { value: "insurance_receipt", label: "Insurance Receipt" }, { value: "loan_certificate", label: "Loan Certificate" },
  { value: "investment_statement", label: "Investment Statement" }, { value: "other", label: "Other" },
];

interface Doc { id: string; document_type: string; file_name: string; file_size_bytes: number; processing_status: string; confidence_score: number | null; detected_doc_type: string | null; created_at: string; }

export default function DocumentsPage() {
  return <ProtectedRoute><AppLayout><DocumentsContent /></AppLayout></ProtectedRoute>;
}
function DocumentsContent() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("salary_slip");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = () => {
    fetch("/api/documents", { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } })
      .then(r => r.json()).then(d => { setDocs(d.items || []); setError(""); })
      .catch(() => setError("Failed to load")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true); setError("");
    const fd = new FormData(); fd.append("file", file); fd.append("document_type", docType);
    try {
      const res = await fetch("/api/documents", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` }, body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || "Upload failed");
      toast({ title: `${file.name} uploaded & processed!`, description: `Type detected: ${d.detected_doc_type}, confidence: ${Math.round((d.confidence_score || 0) * 100)}%` });
      load();
    } catch (e: any) { setError(e.message); toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Document deleted." });
      load();
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Documents</h1><p className="text-sm text-slate-400 mt-0.5">Upload financial documents for AI-powered extraction.</p></div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="glass rounded-2xl p-5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Document Type</label>
        <select value={docType} onChange={(e) => setDocType(e.target.value)} className="mb-4 w-full h-10 rounded-lg border border-slate-200 bg-white/50 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20">
          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }} className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-emerald-400 bg-emerald-50/30" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50/50"}`}>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} className="hidden" />
          {uploading ? <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-2" /> : <UploadCloud className={`h-8 w-8 mx-auto mb-2 transition-colors ${dragOver ? "text-emerald-500" : "text-slate-300"}`} />}
          <p className="text-sm font-medium text-slate-600">{uploading ? "Uploading & extracting..." : "Drop your file here, or click to browse"}</p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, CSV, XLSX — max 10MB</p>
        </label>
      </div>

      <div className="glass rounded-2xl p-5">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Uploaded Documents ({docs.length})</label>
        {docs.length === 0 ? (
          <div className="text-center py-10"><div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2"><FileText className="h-5 w-5 text-slate-400" /></div><p className="text-sm font-medium text-slate-600">No documents yet</p><p className="text-xs text-slate-400 mt-1">Upload your first salary slip or Form 16 to get started.</p></div>
        ) : (
          <div className="space-y-2">{docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50/50 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText className="h-4 w-4 text-emerald-600" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{d.file_name}</p><p className="text-xs text-slate-400">{d.detected_doc_type || d.document_type} • {formatBytes(d.file_size_bytes)} • {formatDate(d.created_at)}</p></div>
              <Badge className={d.processing_status === "extracted" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>{d.processing_status}</Badge>
              {d.confidence_score != null && <span className="text-xs text-slate-400">{Math.round(d.confidence_score * 100)}%</span>}
              <Link href={`/documents/${d.id}`} className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors" title="View & verify extracted fields"><ArrowRight className="h-4 w-4 text-emerald-500" /></Link>
              <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete document"><Trash2 className="h-4 w-4 text-slate-300 hover:text-red-500" /></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}
