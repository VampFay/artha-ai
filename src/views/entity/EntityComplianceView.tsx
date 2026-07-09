"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntityDetail } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Loader2, Calendar, AlertCircle, Clock, CheckCircle2, FileText, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntityComplianceView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "due-soon" | "upcoming">("all");

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    Promise.all([
      entitiesApi.get(entityId),
      entitiesApi.complianceCalendar(entityId, 12),
    ])
      .then(([e, cal]) => {
        setEntity(e.data);
        setCalendar(cal.data);
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

  if (!entity || !calendar) return null;

  const allEntries = calendar.calendar || [];
  const filtered = filter === "all" ? allEntries : allEntries.filter((e: any) => e.status === filter);

  const stats = calendar.summary || { totalUpcoming: 0, totalOverdue: 0, criticalDue: 0 };

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
          <Calendar className="w-6 h-6 text-saffron" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">Compliance Calendar</h1>
        </div>
        <p className="text-stone text-sm">{entity.name} · Next 12 months</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox label="Total Filings" value={allEntries.length} icon={<FileText className="w-4 h-4" />} />
        <StatBox label="Overdue" value={stats.totalOverdue} icon={<AlertCircle className="w-4 h-4" />} danger />
        <StatBox label="Due This Week" value={stats.criticalDue} icon={<Clock className="w-4 h-4" />} warning />
        <StatBox label="Upcoming" value={stats.totalUpcoming} icon={<CheckCircle2 className="w-4 h-4" />} success />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-3 h-3 text-stone shrink-0" />
        {(["all", "overdue", "due-soon", "upcoming"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
              filter === f ? "bg-carbon text-white" : "bg-carbon/5 text-stone hover:bg-carbon/10"
            )}
          >
            {f.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Filings list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="p-12 border border-dashed border-carbon/10 rounded-2xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-stone">No {filter !== "all" ? filter.replace("-", " ") : ""} filings</p>
          </div>
        ) : (
          filtered.map((entry: any, i: number) => {
            const { filing, dueDate, daysUntilDue, status, isFiled } = entry;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  "p-4 bg-white border rounded-xl flex items-start gap-4 hover:shadow-sm transition-shadow",
                  status === "overdue" ? "border-red-200" :
                  status === "due-soon" ? "border-amber-200" :
                  "border-carbon/5"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0",
                  isFiled ? "bg-emerald-100 text-emerald-700" :
                  status === "overdue" ? "bg-red-100 text-red-600" :
                  status === "due-soon" ? "bg-amber-100 text-amber-700" :
                  "bg-carbon/5 text-stone"
                )}>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{new Date(dueDate).toLocaleDateString("en-IN", { month: "short" })}</span>
                  <span className="text-sm font-bold leading-none">{new Date(dueDate).getDate()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-carbon">{filing.name}</h3>
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                          filing.priority === "critical" ? "bg-red-100 text-red-700" :
                          filing.priority === "high" ? "bg-amber-100 text-amber-700" :
                          "bg-carbon/5 text-stone"
                        )}>{filing.priority}</span>
                        {isFiled && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold uppercase tracking-wider">Filed</span>}
                      </div>
                      <p className="text-[10px] text-stone mt-1 uppercase tracking-wider">
                        {filing.form} · {filing.frequency} · {filing.statutoryBody}
                      </p>
                      <p className="text-[11px] text-stone/80 mt-1 line-clamp-2">{filing.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(
                        "text-xs font-bold whitespace-nowrap",
                        isFiled ? "text-emerald-600" :
                        daysUntilDue < 0 ? "text-red-600" :
                        daysUntilDue <= 7 ? "text-amber-600" : "text-carbon"
                      )}>
                        {isFiled ? "Completed" :
                         daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` :
                         daysUntilDue === 0 ? "Today" :
                         `${daysUntilDue}d left`}
                      </p>
                      <p className="text-[10px] text-stone mt-0.5">
                        {new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-red-500 mt-2">⚠ Penalty: {filing.penalty}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon, danger, warning, success }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  return (
    <div className={cn(
      "p-4 rounded-xl border",
      danger ? "bg-red-50 border-red-200" :
      warning ? "bg-amber-50 border-amber-200" :
      success ? "bg-emerald-50 border-emerald-200" :
      "bg-white border-carbon/5"
    )}>
      <div className={cn(
        "mb-2",
        danger ? "text-red-600" :
        warning ? "text-amber-600" :
        success ? "text-emerald-600" :
        "text-saffron"
      )}>{icon}</div>
      <p className="text-2xl font-light text-carbon">{value}</p>
      <p className="text-[9px] text-stone uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
