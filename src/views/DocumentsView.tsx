"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ViewState } from "@/lib/types";
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Trash2, FileText, Image as ImageIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentsViewProps { onNavigate: (view: ViewState) => void; }

const DOC_TYPES = ["Salary Slip", "Form 16", "Bank Statement", "Rent Receipt", "Insurance", "Loan Certificate", "Investment", "Other"];
const TYPE_MAP: Record<string, string> = {
  "Salary Slip": "salary_slip", "Form 16": "form16", "Bank Statement": "bank_statement",
  "Rent Receipt": "rent_receipt", "Insurance": "insurance_receipt",
  "Loan Certificate": "loan_certificate", "Investment": "investment_statement", "Other": "other",
};

interface Doc {
  id: string; document_type: string; file_name: string; file_size_bytes: number;
  processing_status: string; confidence_score: number | null; detected_doc_type: string | null; created_at: string;
}

export default function DocumentsView({ onNavigate }: DocumentsViewProps) {
  const [activeType, setActiveType] = useState("Salary Slip");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    fetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setDocs(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => setUploadProgress(p => Math.min(85, p + 8)), 100);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", TYPE_MAP[activeType] || "other");
    try {
      const token = localStorage.getItem("finsight_token");
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail);
      setUploadProgress(100);
      setTimeout(() => { setUploadProgress(0); setUploading(false); }, 500);
      load();
    } catch (e: any) {
      setUploading(false);
      clearInterval(interval);
    } finally {
      clearInterval(interval);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleUpload(f);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("finsight_token");
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      load();
    } catch {}
  };

  const getIcon = (fname: string) => {
    const ext = fname.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "xlsx") return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    if (ext === "jpg" || ext === "png" || ext === "jpeg") return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    return <FileText className="w-5 h-5 text-red-600" />;
  };

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div className="flex flex-col">
      <div className="px-8 lg:px-12 pt-8 max-w-5xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-michroma tracking-tight text-carbon mb-2">Documents</h1>
          <p className="text-stone">Upload and manage your financial documents securely.</p>
        </header>

        <section className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {DOC_TYPES.map(type => (
              <button key={type} onClick={() => setActiveType(type)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors border", activeType === type ? "bg-carbon text-canvas border-carbon" : "bg-white text-stone border-stone/20 hover:border-stone/40")}>{type}</button>
            ))}
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={cn("relative overflow-hidden rounded-3xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-all bg-white cursor-pointer", isDragging ? "border-saffron bg-saffron/5" : "border-stone/20 hover:border-saffron/30 hover:bg-saffron/5", uploading && "pointer-events-none")}
          >
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
            {uploading && <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="absolute left-0 bottom-0 h-1.5 bg-saffron" />}
            <div className="w-16 h-16 rounded-full bg-saffron/10 text-saffron flex items-center justify-center mb-4">
              {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-medium text-carbon mb-1">{uploading ? "Processing..." : isDragging ? "Drop to upload" : "Drop file or click to browse"}</h3>
            <p className="text-sm text-stone max-w-sm">Supports PDF, CSV, XLSX, JPG, PNG up to 10MB. Data is encrypted and extracted locally.</p>
            {uploading && <p className="text-xs text-saffron font-geist-pixel mt-2">{uploadProgress}%</p>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-carbon">Your Documents</h2>
            <span className="text-sm font-medium text-stone">{docs.length} total</span>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-stone/10 rounded-3xl bg-white">
              <div className="w-20 h-20 rounded-full bg-stone/5 flex items-center justify-center mb-4"><FileText className="w-10 h-10 text-stone/40" /></div>
              <h3 className="text-lg font-medium text-carbon">No documents yet</h3>
              <p className="text-sm text-stone mt-1">Upload a document to see extracted insights.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {docs.map(doc => (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-2xl border border-stone/10 shadow-sm gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-stone/5 flex items-center justify-center shrink-0">{getIcon(doc.file_name)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-medium text-carbon truncate max-w-[200px] sm:max-w-xs">{doc.file_name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-stone/10 text-stone">{doc.detected_doc_type || doc.document_type}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone"><span>{formatSize(doc.file_size_bytes)}</span><span>•</span><span>{new Date(doc.created_at).toLocaleDateString("en-IN")}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2">
                        {doc.processing_status === "extracted" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /><span>Extracted{doc.confidence_score != null ? ` (${Math.round(doc.confidence_score * 100)}%)` : ""}</span>
                          </div>
                        ) : doc.processing_status === "failed" ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" /><span>Failed</span></div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium"><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Processing</span></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button aria-label="Delete document" onClick={() => handleDelete(doc.id)} className="p-2 text-stone hover:text-crimson hover:bg-crimson/5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => onNavigate("document-verify" as ViewState)} className="flex items-center gap-1.5 px-4 py-2 bg-stone/5 hover:bg-stone/10 text-carbon rounded-xl text-sm font-medium transition-colors"><span>Review</span><ArrowRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
