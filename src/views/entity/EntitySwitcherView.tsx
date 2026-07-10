"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntitySummary } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Plus, Building2, ChevronRight, Loader2 } from "lucide-react";

export default function EntitySwitcherView() {
  const { setActiveEntityId } = usePortal();
  const { navigate } = useNav();
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entitiesApi.list()
      .then((res) => setEntities(res.data || []))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (entity: EntitySummary) => {
    setActiveEntityId(entity.id);
    navigate("entity-dashboard", { entity_id: entity.id });
  };

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      <div className="mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Entities Portal</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2">Your Entities</h1>
        <p className="text-stone text-sm">Switch between companies, banks, universities, and other institutions you manage</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-saffron" />
        </div>
      ) : entities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 border-2 border-dashed border-carbon/10 rounded-2xl"
        >
          <Building2 className="w-12 h-12 text-stone/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-carbon mb-1">No entities yet</h3>
          <p className="text-sm text-stone mb-6">Set up your first entity to start tracking its tax and compliance</p>
          <button
            onClick={() => navigate("entity-onboarding")}
            className="inline-flex items-center gap-2 px-6 py-2 bg-saffron text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Create First Entity
          </button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {entities.map((entity, i) => (
              <motion.button
                key={entity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleSelect(entity)}
                className="p-5 bg-white border border-carbon/10 rounded-2xl hover:border-saffron hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{entity.iconEmoji}</span>
                  <ChevronRight className="w-4 h-4 text-stone/40 group-hover:text-saffron group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-medium text-carbon mb-1 truncate">{entity.name}</h3>
                <p className="text-[10px] text-stone uppercase tracking-wider mb-3 truncate">{entity.entityTypeLabel}</p>
                <div className="flex items-center gap-3 text-[10px] text-stone/60">
                  <span>{entity.teamCount} members</span>
                  <span>·</span>
                  <span>{entity.filingCount} filings</span>
                </div>
                {entity.city && (
                  <p className="text-[10px] text-stone/60 mt-1">📍 {entity.city}</p>
                )}
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => navigate("entity-onboarding")}
            className="inline-flex items-center gap-2 px-6 py-2 border border-saffron text-saffron rounded-full text-xs font-bold uppercase tracking-wider hover:bg-saffron/5 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Another Entity
          </button>
        </>
      )}
    </div>
  );
}
