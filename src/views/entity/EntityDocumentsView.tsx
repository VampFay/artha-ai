"use client";
import { useState, useEffect } from "react";

import { entities as entitiesApi, type EntityDetail } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Loader2, FileText, Upload, Search } from "lucide-react";


const DOC_TYPES = [
  { id: "gstr_1", label: "GSTR-1", desc: "Outward supplies return" },
  { id: "gstr_3b", label: "GSTR-3B", desc: "Monthly summary" },
  { id: "gstr_9", label: "GSTR-9", desc: "Annual return" },
  { id: "tds_certificate", label: "TDS Certificate", desc: "Form 16/16A" },
  { id: "audit_report", label: "Audit Report", desc: "Form 3CD/3CEB" },
  { id: "tax_notice", label: "Tax Notice", desc: "From dept" },
  { id: "invoice", label: "Invoice", desc: "Sales/Purchase" },
  { id: "financial_statement", label: "Financial Statement", desc: "P&L, Balance Sheet" },
  { id: "board_resolution", label: "Board Resolution", desc: "Corporate" },
  { id: "other", label: "Other", desc: "Misc document" },
];

export default function EntityDocumentsView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    entitiesApi.get(entityId)
      .then((res) => setEntity(res.data))
      .catch(() => navigate("entity-switcher"))
      .finally(() => setLoading(false));
  }, [entityId]);

  if (loading) {
    return (
      <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-saffron" />
        </div>
      </div>
    );
  }

  if (!entity) return null;

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      <div className="mb-8">
        <button
          onClick={() => navigate("entity-dashboard", { entity_id: entity.id })}
          className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-saffron" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">Documents</h1>
        </div>
        <p className="text-stone text-sm">{entity.name} · Tax filings, audit reports, notices, contracts</p>
      </div>

      {/* Upload area */}
      <div className="p-8 border-2 border-dashed border-carbon/10 rounded-2xl text-center hover:border-saffron hover:bg-saffron/5 transition-colors cursor-pointer mb-8">
        <Upload className="w-8 h-8 text-stone/40 mx-auto mb-3" />
        <p className="text-sm text-carbon font-medium">Drop documents here or click to upload</p>
        <p className="text-[11px] text-stone/60 mt-1">PDF, JPG, PNG, XLSX up to 25 MB</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-10 pr-3 py-2 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron"
        />
      </div>

      {/* Document type categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {DOC_TYPES.map((dt) => (
          <button
            key={dt.id}
            className="p-4 bg-white border border-carbon/5 rounded-xl hover:border-saffron hover:shadow-sm transition-all text-left"
          >
            <FileText className="w-4 h-4 text-saffron mb-2" />
            <p className="text-xs font-medium text-carbon">{dt.label}</p>
            <p className="text-[10px] text-stone mt-0.5">{dt.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-[11px] text-stone/60 text-center">
          📁 Document vault integrates with encrypted S3 storage. All files are KMS-encrypted, hash-chained, and audit-logged.
        </p>
      </div>
    </div>
  );
}
