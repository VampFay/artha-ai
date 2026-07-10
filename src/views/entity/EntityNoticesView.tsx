"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntityDetail } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Loader2, FileText, AlertTriangle, Calendar, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntityNoticesView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    Promise.all([
      entitiesApi.get(entityId),
      entitiesApi.notices(entityId),
    ])
      .then(([e, n]) => {
        setEntity(e.data);
        setNotices(n.data || []);
      })
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
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">Tax Notices</h1>
        </div>
        <p className="text-stone text-sm">{entity.name} · {notices.length} notice{notices.length !== 1 ? "s" : ""}</p>
      </div>

      {notices.length === 0 ? (
        <div className="p-12 border border-dashed border-carbon/10 rounded-2xl text-center">
          <FileText className="w-8 h-8 text-stone/30 mx-auto mb-2" />
          <p className="text-sm text-stone">No tax notices received</p>
          <p className="text-[11px] text-stone/60 mt-1">Notices from CBDT, CBIC, or state authorities will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "p-5 border rounded-2xl",
                n.status === "received" ? "bg-amber-50 border-amber-200" :
                n.status === "resolved" ? "bg-emerald-50 border-emerald-200" :
                n.status === "disputed" ? "bg-red-50 border-red-200" :
                "bg-white border-carbon/10"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-carbon">{n.noticeType.replace(/_/g, " ")}</h3>
                  <p className="text-[10px] text-stone mt-1 uppercase tracking-wider">
                    {n.issuedBy && `${n.issuedBy} · `}
                    {new Date(n.issuedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    {n.din && ` · DIN: ${n.din}`}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0",
                  n.status === "received" ? "bg-amber-200 text-amber-800" :
                  n.status === "resolved" ? "bg-emerald-200 text-emerald-800" :
                  n.status === "disputed" ? "bg-red-200 text-red-800" :
                  "bg-blue-200 text-blue-800"
                )}>{n.status}</span>
              </div>

              {n.amountDemand && (
                <p className="text-sm text-carbon font-medium mb-2">
                  Demand Amount: ₹{n.amountDemand.toLocaleString("en-IN")}
                </p>
              )}

              {n.dueDate && (
                <p className="text-xs text-stone flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3" />
                  Response due: {new Date(n.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}

              {n.notes && (
                <p className="text-[11px] text-stone mt-2 pt-2 border-t border-carbon/5">{n.notes}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
