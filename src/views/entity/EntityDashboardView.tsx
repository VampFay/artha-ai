"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntityDetail } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import {
  AlertCircle, Calendar, FileText, TrendingUp, Users, Building2,
  Loader2, ArrowRight, AlertTriangle, CheckCircle2, Clock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntityDashboardView() {
  const { activeEntityId, setActiveEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [taxProfile, setTaxProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    setActiveEntityId(entityId);
    Promise.all([
      entitiesApi.get(entityId),
      entitiesApi.complianceCalendar(entityId, 6),
      entitiesApi.taxSummary.get(entityId).catch(() => null),
    ])
      .then(([e, cal, tax]) => {
        setEntity(e.data);
        setCalendar(cal.data);
        setTaxProfile(tax?.data || null);
      })
      .catch(() => {
        navigate("entity-switcher");
      })
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

  const upcomingFilings = calendar?.upcoming?.slice(0, 5) || [];
  const overdueCount = calendar?.summary?.totalOverdue || 0;
  const criticalDue = calendar?.summary?.criticalDue || 0;

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button
          onClick={() => navigate("entity-switcher")}
          className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors"
        >
          ← All Entities
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <span className="text-5xl">{entity.iconEmoji}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon mb-1">{entity.name}</h1>
              <p className="text-stone text-sm">{entity.entityTypeLabel}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {entity.pan && <span className="text-[10px] px-2 py-0.5 rounded-full bg-carbon/5 text-stone">PAN: {entity.pan}</span>}
                {entity.gstin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-carbon/5 text-stone">GSTIN: {entity.gstin}</span>}
                {entity.city && <span className="text-[10px] px-2 py-0.5 rounded-full bg-carbon/5 text-stone">📍 {entity.city}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-stone uppercase tracking-widest mb-1">FY 2024-25</p>
            {taxProfile ? (
              <>
                <p className="text-3xl font-light text-carbon">₹{(taxProfile.totalTaxBurden / 100000).toFixed(2)}L</p>
                <p className="text-[10px] text-stone uppercase tracking-wider">Total tax burden</p>
                <p className="text-[10px] text-saffron mt-1">{(taxProfile.effectiveTaxRate * 100).toFixed(2)}% effective</p>
              </>
            ) : (
              <button
                onClick={() => navigate("entity-tax", { entity_id: entity.id })}
                className="text-[10px] px-3 py-1.5 bg-saffron/10 text-saffron rounded-full font-bold uppercase tracking-wider hover:bg-saffron/20 transition-colors"
              >
                Compute Tax →
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Alert banner */}
      {(overdueCount > 0 || criticalDue > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-4 rounded-2xl mb-8 flex items-center gap-3",
            overdueCount > 0 ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
          )}
        >
          {overdueCount > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          ) : (
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-carbon">
              {overdueCount > 0
                ? `${overdueCount} overdue filing${overdueCount > 1 ? "s" : ""} — immediate action required`
                : `${criticalDue} critical filing${criticalDue > 1 ? "s" : ""} due this week`}
            </p>
          </div>
          <button
            onClick={() => navigate("entity-compliance", { entity_id: entity.id })}
            className="text-xs font-bold text-carbon hover:underline flex items-center gap-1"
          >
            View <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-saffron" />}
          label="Turnover (Last Yr)"
          value={entity.turnoverLastYear ? `₹${(entity.turnoverLastYear / 10000000).toFixed(2)}Cr` : "—"}
        />
        <StatCard
          icon={<Calendar className="w-4 h-4 text-saffron" />}
          label="Upcoming Filings"
          value={calendar?.summary?.totalUpcoming?.toString() || "0"}
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-saffron" />}
          label="Team Members"
          value={entity.teamMembers?.length?.toString() || "0"}
        />
        <StatCard
          icon={<Shield className="w-4 h-4 text-saffron" />}
          label="Regulators"
          value={entity.entityTypeDef?.regulators?.length?.toString() || "0"}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming filings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-wider text-carbon uppercase">Upcoming Filings</h2>
            <button
              onClick={() => navigate("entity-compliance", { entity_id: entity.id })}
              className="text-[10px] text-saffron hover:underline font-bold uppercase tracking-wider"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {upcomingFilings.length === 0 ? (
              <div className="p-6 border border-dashed border-carbon/10 rounded-xl text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs text-stone">No filings due in the next 3 months</p>
              </div>
            ) : (
              upcomingFilings.map((f: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 bg-white border border-carbon/5 rounded-xl flex items-center justify-between hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      f.status === "overdue" ? "bg-red-100 text-red-600" :
                      f.status === "due-soon" ? "bg-amber-100 text-amber-600" :
                      "bg-carbon/5 text-stone"
                    )}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-carbon truncate">{f.filing.name}</p>
                      <p className="text-[10px] text-stone uppercase tracking-wider">
                        {f.filing.form} · {f.filing.statutoryBody}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "text-xs font-bold",
                      f.status === "overdue" ? "text-red-600" :
                      f.status === "due-soon" ? "text-amber-600" : "text-carbon"
                    )}>
                      {f.daysUntilDue < 0 ? `${Math.abs(f.daysUntilDue)}d overdue` : `${f.daysUntilDue}d left`}
                    </p>
                    <p className="text-[10px] text-stone">
                      {new Date(f.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Side: Regulators + Team */}
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-carbon uppercase mb-4">Regulators</h2>
            <div className="flex flex-wrap gap-2">
              {entity.entityTypeDef?.regulators?.map((r: string) => (
                <span key={r} className="text-[10px] px-2.5 py-1 rounded-full bg-carbon/5 text-carbon font-bold uppercase tracking-wider">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold tracking-wider text-carbon uppercase mb-4">Tax Applicability</h2>
            <div className="space-y-2">
              <ApplicabilityRow label="Income Tax" applicable={entity.entityTypeDef?.taxRegime !== "exempt_govt" && entity.entityTypeDef?.taxRegime !== "exempt_local_authority"} value={entity.entityTypeDef?.taxRegime?.replace(/_/g, " ")} />
              <ApplicabilityRow label="GST" applicable={entity.entityTypeDef?.gstApplicable} value={entity.entityTypeDef?.gstApplicable ? `${entity.entityTypeDef.gstDefaultRate}%` : "Exempt"} />
              <ApplicabilityRow label="TDS" applicable={entity.entityTypeDef?.tdsApplicable} />
              <ApplicabilityRow label="TCS" applicable={entity.entityTypeDef?.tcsApplicable} />
              <ApplicabilityRow label="MAT" applicable={entity.entityTypeDef?.matApplicable} />
              <ApplicabilityRow label="CSR" applicable={entity.entityTypeDef?.csrApplicable} />
              <ApplicabilityRow label="Transfer Pricing" applicable={entity.entityTypeDef?.transferPricingRisk} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-wider text-carbon uppercase">Team</h2>
              <button
                onClick={() => navigate("entity-team", { entity_id: entity.id })}
                className="text-[10px] text-saffron hover:underline font-bold uppercase tracking-wider"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-2">
              {entity.teamMembers?.slice(0, 4).map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-saffron text-white flex items-center justify-center text-[10px] font-bold">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-carbon truncate">{m.name}</p>
                    <p className="text-[9px] text-stone uppercase tracking-wider">{m.role.replace(/_/g, " ")}</p>
                  </div>
                </div>
              ))}
              {entity.teamMembers?.length === 0 && (
                <p className="text-[11px] text-stone">No team members yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent notices (if any) */}
      {entity.recentNotices && entity.recentNotices.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-wider text-carbon uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Recent Notices
            </h2>
            <button
              onClick={() => navigate("entity-notices", { entity_id: entity.id })}
              className="text-[10px] text-saffron hover:underline font-bold uppercase tracking-wider"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {entity.recentNotices.slice(0, 3).map((n: any) => (
              <div key={n.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-carbon">{n.noticeType.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-stone mt-0.5">
                      {n.issuedBy} · {new Date(n.issuedDate).toLocaleDateString("en-IN")}
                      {n.din && ` · DIN: ${n.din}`}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    n.status === "received" ? "bg-amber-200 text-amber-800" :
                    n.status === "resolved" ? "bg-emerald-200 text-emerald-800" :
                    "bg-carbon/10 text-carbon"
                  )}>{n.status}</span>
                </div>
                {n.amountDemand && (
                  <p className="text-sm text-carbon mt-2">Demand: ₹{n.amountDemand.toLocaleString("en-IN")}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-white border border-carbon/5 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[9px] font-bold text-stone uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-light text-carbon">{value}</p>
    </div>
  );
}

function ApplicabilityRow({ label, applicable, value }: { label: string; applicable?: boolean; value?: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1">
      <span className="text-stone">{label}</span>
      <span className={cn("font-medium flex items-center gap-1", applicable ? "text-carbon" : "text-stone/40")}>
        {applicable ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : null}
        {value || (applicable ? "Applicable" : "N/A")}
      </span>
    </div>
  );
}
