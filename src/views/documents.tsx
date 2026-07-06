"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNav } from "@/lib/nav-context";
import { formatDate, formatBytes } from "@/lib/format";
import { UploadCloud, FileText, Trash2, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
const { useToast } = require("@/hooks/use-toast");

const DOC_TYPES = [
  { value: "salary_slip", label: "Salary Slip" }, { value: "form16", label: "Form 16" },
  { value: "bank_statement", label: "Bank Statement" }, { value: "rent_receipt", label: "Rent Receipt" },
  { value: "insurance_receipt", label: "Insurance" }, { value: "loan_certificate", label: "Loan Certificate" },
  { value: "investment_statement", label: "Investment" }, { value: "other", label: "Other" },
];

interface Doc { id: string; document_type: string; file_name: string; file_size_bytes: number; processing_status: string; confidence_score: number | null; detected_doc_type: string | null; created_at: string; }

export default function DocumentsContent() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("salary_slip");
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { navigate } = useNav();

  const load = () => {
    fetch("/api/documents", { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } })
      .then(r => r.json())
      .then(d => setDocs(d.items || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    setUploading(true); setUploadProgress(0);
    // Simulate progress for visual feedback
    const interval = setInterval(() => setUploadProgress(p => Math.min(85, p + 8)), 100);
    const fd = new FormData();
    fd.append("file", file); fd.append("document_type", docType);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
      toast({ title: `${file.name} uploaded!`, description: `${d.detected_doc_type} • ${Math.round((d.confidence_score||0)*100)}% confidence` });
      load();
    } catch (e: any) { toast({ title: "Upload failed", description: e.message, variant: "destructive" }); }
    finally { setUploading(false); clearInterval(interval); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } });
      toast({ title: "Document deleted." });
      load();
    } catch {}
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-40" />
      <div className="skeleton h-48 rounded-[20px]" />
      <div className="skeleton h-64 rounded-[20px]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-caption mb-2 flex items-center gap-2">
            <span className="dot dot-live" style={{ background: "var(--color-moss)" }} />Upload & Extract
          </p>
          <h1 className="text-heading">Documents</h1>
        </div>
      </Reveal>

      {/* Upload zone */}
      <Reveal delay={0.05}>
        <motion.div
          whileHover={{ y: -3 }}
          className="bento bento-light p-6"
        >
          <label className="text-label mb-2 block">Document Type</label>
          <div className="flex gap-2 flex-wrap mb-4">
            {DOC_TYPES.map(t => (
              <motion.button
                key={t.value}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setDocType(t.value)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={docType === t.value
                  ? { background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }
                  : { background: "rgba(13,59,46,0.04)", color: "var(--color-ink-soft)", border: "1px solid rgba(13,59,46,0.08)" }
                }
              >
                {t.label}
              </motion.button>
            ))}
          </div>

          <motion.label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer relative overflow-hidden transition-all"
            style={dragOver
              ? { borderColor: "var(--color-forest)", background: "rgba(13,59,46,0.04)" }
              : { borderColor: "var(--color-line)" }
            }
          >
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} disabled={uploading} className="hidden" />

            {uploading ? (
              <div className="relative">
                <motion.div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                  style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}
                >
                  <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--color-gold-light)" }} />
                </motion.div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>Processing...</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Extracting fields with AI</p>
                <div className="mt-4 max-w-xs mx-auto">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-cream-dark)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #0d3b2e, #d4a017)" }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] font-mono mt-1.5" style={{ color: "var(--color-ink-muted)" }}>{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <motion.div
                  animate={dragOver ? { y: -6, scale: 1.05 } : { y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(13,59,46,0.08), rgba(212,160,23,0.08))" }}
                >
                  <UploadCloud className="h-7 w-7" style={{ color: dragOver ? "var(--color-forest)" : "var(--color-ink-soft)" }} />
                </motion.div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {dragOver ? "Drop to upload" : "Drop file or click to browse"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>PDF, JPG, PNG, CSV, XLSX — max 10MB</p>
              </div>
            )}
          </motion.label>
        </motion.div>
      </Reveal>

      {/* Documents list */}
      <Reveal delay={0.1}>
        <motion.div whileHover={{ y: -3 }} className="bento bento-light p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-caption">Documents ({docs.length})</p>
            {docs.length > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-moss)" }}>
                {docs.filter(d => d.processing_status === "extracted").length} extracted
              </span>
            )}
          </div>

          {docs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(13,59,46,0.06)" }}
              >
                <FileText className="h-7 w-7" style={{ color: "var(--color-ink-muted)" }} />
              </motion.div>
              <p className="text-sm font-medium" style={{ color: "var(--color-ink-soft)" }}>No documents yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-ink-muted)" }}>Upload your first document to get started.</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {docs.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                  style={{ background: "var(--color-surface-warm)", border: "1px solid var(--color-line-soft)" }}
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, rgba(13,59,46,0.08), rgba(212,160,23,0.08))" }}
                  >
                    <FileText className="h-4 w-4" style={{ color: "var(--color-forest)" }} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-ink)" }}>{d.file_name}</p>
                    <p className="text-xs flex items-center gap-2" style={{ color: "var(--color-ink-muted)" }}>
                      <span>{d.detected_doc_type || d.document_type}</span>
                      <span>•</span>
                      <span>{formatBytes(d.file_size_bytes)}</span>
                      <span>•</span>
                      <span>{formatDate(d.created_at)}</span>
                    </p>
                  </div>
                  <motion.span
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1"
                    style={d.processing_status === "extracted"
                      ? { background: "rgba(74,124,89,0.1)", color: "var(--color-moss)" }
                      : { background: "rgba(198,93,58,0.1)", color: "var(--color-clay)" }
                    }
                  >
                    {d.processing_status === "extracted" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                    {d.processing_status}
                  </motion.span>
                  {d.confidence_score != null && (
                    <span className="text-xs font-mono font-semibold" style={{ color: "var(--color-ink-muted)" }}>
                      {Math.round(d.confidence_score * 100)}%
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate("document-verify", { id: d.id })}
                    className="p-2 rounded-lg"
                    style={{ background: "rgba(13,59,46,0.06)", color: "var(--color-forest)" }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, color: "var(--color-clay)" }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(d.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--color-ink-muted)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </Reveal>
    </div>
  );
}
