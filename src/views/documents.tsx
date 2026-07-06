"use client";
import { useEffect, useState, useRef } from "react";
import { useNav } from "@/lib/nav-context";
import { formatDate, formatBytes } from "@/lib/format";
import { UploadCloud, FileText, Trash2, Loader2, ArrowRight } from "lucide-react";
const { useToast } = require("@/hooks/use-toast");
const DOC_TYPES = [{ value: "salary_slip", label: "Salary Slip" }, { value: "form16", label: "Form 16" }, { value: "bank_statement", label: "Bank Statement" }, { value: "rent_receipt", label: "Rent Receipt" }, { value: "insurance_receipt", label: "Insurance" }, { value: "loan_certificate", label: "Loan Certificate" }, { value: "investment_statement", label: "Investment" }, { value: "other", label: "Other" }];
interface Doc { id: string; document_type: string; file_name: string; file_size_bytes: number; processing_status: string; confidence_score: number | null; detected_doc_type: string | null; created_at: string; }
export default function DocumentsContent() {
  const [docs, setDocs] = useState<Doc[]>([]); const [loading, setLoading] = useState(true); const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("salary_slip"); const [dragOver, setDragOver] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast(); const { navigate } = useNav();
  const load = () => { fetch("/api/documents", { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } }).then(r => r.json()).then(d => setDocs(d.items || [])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const handleUpload = async (file: File) => { setUploading(true); const fd = new FormData(); fd.append("file", file); fd.append("document_type", docType); try { const res = await fetch("/api/documents", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` }, body: fd }); const d = await res.json(); if (!res.ok) throw new Error(d.detail); toast({ title: `${file.name} uploaded!`, description: `${d.detected_doc_type} • ${Math.round((d.confidence_score||0)*100)}% confidence` }); load(); } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; } };
  const handleDelete = async (id: string) => { try { await fetch(`/api/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } }); toast({ title: "Deleted." }); load(); } catch {} };
  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="animate-slide-up"><p className="text-caption mb-1">Upload & Extract</p><h1 className="text-heading">Documents</h1></div>
      <div className="bento bento-light p-6 animate-slide-up stagger-1">
        <label className="text-label mb-2 block">Document Type</label>
        <select value={docType} onChange={e => setDocType(e.target.value)} className="mb-4 w-full h-10 rounded-lg border px-3 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={e => e.target.style.borderColor = "var(--color-forest)"} onBlur={e => e.target.style.borderColor = "var(--color-line)"}>{DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <label onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }} className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all" style={dragOver ? { borderColor: "var(--color-forest)", background: "rgba(13,59,46,0.02)" } : { borderColor: "var(--color-line)" }}>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} className="hidden" />
          {uploading ? <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: "var(--color-forest)" }} /> : <UploadCloud className="h-8 w-8 mx-auto mb-2 transition-colors" style={{ color: dragOver ? "var(--color-forest)" : "var(--color-ink-muted)" }} />}
          <p className="text-sm font-medium" style={{ color: "var(--color-ink-soft)" }}>{uploading ? "Processing..." : "Drop file or click to browse"}</p><p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>PDF, JPG, PNG, CSV, XLSX — max 10MB</p>
        </label>
      </div>
      <div className="bento bento-light p-6 animate-slide-up stagger-2">
        <p className="text-label mb-3">Documents ({docs.length})</p>
        {docs.length === 0 ? <div className="text-center py-8"><FileText className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--color-ink-muted)" }} /><p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No documents yet</p></div> :
        <div className="space-y-2">{docs.map(d => <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg transition-colors" style={{ background: "var(--color-surface-warm)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--color-cream-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--color-surface-warm)"}>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,59,46,0.06)" }}><FileText className="h-4 w-4" style={{ color: "var(--color-forest)" }} /></div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: "var(--color-ink)" }}>{d.file_name}</p><p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{d.detected_doc_type || d.document_type} • {formatBytes(d.file_size_bytes)} • {formatDate(d.created_at)}</p></div>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded" style={{ background: d.processing_status === "extracted" ? "rgba(13,59,46,0.08)" : "rgba(198,93,58,0.08)", color: d.processing_status === "extracted" ? "var(--color-forest)" : "var(--color-clay)" }}>{d.processing_status}</span>
          {d.confidence_score != null && <span className="text-xs font-mono" style={{ color: "var(--color-ink-muted)" }}>{Math.round(d.confidence_score * 100)}%</span>}
          <button onClick={() => navigate("document-verify", { id: d.id })} className="p-1.5 rounded-lg transition-colors"><ArrowRight className="h-4 w-4" style={{ color: "var(--color-forest)" }} /></button>
          <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-ink-muted)" }}><Trash2 className="h-4 w-4" /></button>
        </div>)}</div>}
      </div>
    </div>
  );
}
