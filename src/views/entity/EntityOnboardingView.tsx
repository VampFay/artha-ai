"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { entities as entitiesApi } from "@/lib/api";
import { ENTITY_CATEGORIES, ENTITY_TYPES, type EntityType } from "@/lib/entity/types";
import { useNav } from "@/lib/nav-context";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Check, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EntityOnboardingView() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<EntityType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [cin, setCin] = useState("");
  const [tan, setTan] = useState("");
  const [incorporationDate, setIncorporationDate] = useState("");
  const [registeredState, setRegisteredState] = useState("");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [turnoverLastYear, setTurnoverLastYear] = useState("");

  const handleSelectType = (type: EntityType) => {
    setSelectedType(type);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedType || !name) {
      toast({ title: "Missing required fields", description: "Entity type and name are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        entityType: selectedType,
        name,
        legalName: legalName || name,
        pan: pan || undefined,
        gstin: gstin || undefined,
        cin: cin || undefined,
        tan: tan || undefined,
        incorporationDate: incorporationDate || undefined,
        registeredState: registeredState || undefined,
        city: city || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        turnoverLastYear: turnoverLastYear ? parseFloat(turnoverLastYear) : undefined,
      };
      const res = await entitiesApi.create(payload);
      toast({ title: "Entity created", description: `${name} is now ready in your Entities portal` });
      navigate("entity-dashboard", { entity_id: res.data.id });
    } catch (err: any) {
      toast({ title: "Failed to create entity", description: err.detail || "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      <div className="mb-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-saffron" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase">Entity Onboarding</span>
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-carbon mb-2">Set Up Your Entity</h1>
        <p className="text-stone text-sm">Register a business, corporation, government body, or educational institution for tax intelligence</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-12">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
              step >= s ? "bg-saffron text-white" : "bg-carbon/10 text-carbon/50"
            )}>
              {step > s ? <Check className="w-3 h-3" /> : s}
            </div>
            {s < 4 && <div className={cn("w-8 h-px transition-colors", step > s ? "bg-saffron" : "bg-carbon/10")} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-2xl font-light text-carbon mb-2">What type of entity?</h2>
            <p className="text-stone text-sm mb-8">Select the category that best describes your organization</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ENTITY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setStep(2);
                  }}
                  className="p-6 border border-carbon/10 rounded-2xl hover:border-saffron hover:bg-saffron/5 transition-all text-left group"
                >
                  <Building2 className="w-5 h-5 text-saffron mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-base font-medium text-carbon mb-1">{cat.label}</h3>
                  <p className="text-xs text-stone leading-relaxed">{cat.description}</p>
                  <p className="text-[10px] text-stone/50 uppercase tracking-wider mt-3">{cat.types.length} types</p>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button onClick={() => navigate("entity-switcher")} className="text-xs text-stone hover:text-carbon transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && selectedCategory && (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-2xl font-light text-carbon mb-2">Select entity type</h2>
            <p className="text-stone text-sm mb-8">Choose the specific legal structure of your organization</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ENTITY_CATEGORIES.find((c) => c.id === selectedCategory)?.types.map((type) => {
                const def = ENTITY_TYPES[type];
                return (
                  <button
                    key={type}
                    onClick={() => handleSelectType(type)}
                    className="p-5 border border-carbon/10 rounded-xl hover:border-saffron hover:bg-saffron/5 transition-all text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{def.iconEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-carbon mb-1">{def.label}</h3>
                        <p className="text-[11px] text-stone leading-relaxed line-clamp-3">{def.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {def.gstApplicable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-carbon/5 text-stone">GST</span>}
                          {def.tdsApplicable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-carbon/5 text-stone">TDS</span>}
                          {def.csrApplicable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-carbon/5 text-stone">CSR</span>}
                          {def.matApplicable && <span className="text-[9px] px-1.5 py-0.5 rounded bg-carbon/5 text-stone">MAT</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={() => setStep(1)} className="mt-8 text-xs text-stone hover:text-carbon transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Back to categories
            </button>
          </motion.div>
        )}

        {step === 3 && selectedType && (
          <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-3 mb-6 p-4 bg-saffron/5 rounded-xl">
              <span className="text-3xl">{ENTITY_TYPES[selectedType].iconEmoji}</span>
              <div>
                <h3 className="text-base font-medium text-carbon">{ENTITY_TYPES[selectedType].label}</h3>
                <p className="text-xs text-stone">{ENTITY_TYPES[selectedType].description}</p>
              </div>
            </div>

            <h2 className="text-2xl font-light text-carbon mb-2">Basic details</h2>
            <p className="text-stone text-sm mb-8">Provide the entity's identification and registration info</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Field label="Entity Name *" value={name} onChange={setName} placeholder="e.g., Acme Industries Pvt Ltd" />
              <Field label="Legal Name" value={legalName} onChange={setLegalName} placeholder="Full legal name" />
              <Field label="PAN" value={pan} onChange={setPan} placeholder="ABCDE1234F" maxLength={10} />
              <Field label="GSTIN" value={gstin} onChange={setGstin} placeholder="22ABCDE1234F1Z5" maxLength={15} />
              {(ENTITY_TYPES[selectedType].taxRegime === "cit_new_115baa" ||
                ENTITY_TYPES[selectedType].taxRegime === "cit_default" ||
                ENTITY_TYPES[selectedType].taxRegime === "cit_new_mfg_115bab") && (
                <Field label="CIN" value={cin} onChange={setCin} placeholder="U12345MH2024PTC123456" />
              )}
              {ENTITY_TYPES[selectedType].tdsApplicable && (
                <Field label="TAN" value={tan} onChange={setTan} placeholder="MUMA12345B" maxLength={10} />
              )}
              <Field label="Incorporation Date" type="date" value={incorporationDate} onChange={setIncorporationDate} />
              <Field label="Registered State" value={registeredState} onChange={setRegisteredState} placeholder="Maharashtra" />
              <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" />
              <Field label="Contact Email" type="email" value={contactEmail} onChange={setContactEmail} placeholder="finance@acme.com" />
              <Field label="Contact Phone" value={contactPhone} onChange={setContactPhone} placeholder="+91 98765 43210" />
              <Field label="Last Year Turnover (₹)" type="number" value={turnoverLastYear} onChange={setTurnoverLastYear} placeholder="10000000" />
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(2)} className="text-xs text-stone hover:text-carbon transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!name}
                className="px-6 py-2 bg-carbon text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-carbon/90 disabled:opacity-40 transition-opacity flex items-center gap-2"
              >
                Review <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && selectedType && (
          <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-2xl font-light text-carbon mb-2">Review & create</h2>
            <p className="text-stone text-sm mb-8">Confirm the details below to provision this entity</p>

            <div className="bg-white border border-carbon/10 rounded-2xl p-6 max-w-2xl space-y-3">
              <ReviewRow label="Entity Type" value={`${ENTITY_TYPES[selectedType].iconEmoji} ${ENTITY_TYPES[selectedType].label}`} />
              <ReviewRow label="Name" value={name} />
              {legalName && <ReviewRow label="Legal Name" value={legalName} />}
              {pan && <ReviewRow label="PAN" value={pan} />}
              {gstin && <ReviewRow label="GSTIN" value={gstin} />}
              {cin && <ReviewRow label="CIN" value={cin} />}
              {tan && <ReviewRow label="TAN" value={tan} />}
              {city && <ReviewRow label="City" value={city} />}
              {turnoverLastYear && <ReviewRow label="Last Year Turnover" value={`₹${parseFloat(turnoverLastYear).toLocaleString("en-IN")}`} />}
              <div className="pt-4 mt-4 border-t border-carbon/10">
                <p className="text-[10px] text-stone uppercase tracking-wider mb-2">Tax applicability</p>
                <div className="flex flex-wrap gap-2">
                  <Tag>Income Tax: {ENTITY_TYPES[selectedType].taxRegime.replace(/_/g, " ")}</Tag>
                  {ENTITY_TYPES[selectedType].gstApplicable && <Tag>GST @ {ENTITY_TYPES[selectedType].gstDefaultRate}%</Tag>}
                  {ENTITY_TYPES[selectedType].tdsApplicable && <Tag>TDS</Tag>}
                  {ENTITY_TYPES[selectedType].tcsApplicable && <Tag>TCS</Tag>}
                  {ENTITY_TYPES[selectedType].csrApplicable && <Tag>CSR 2%</Tag>}
                  {ENTITY_TYPES[selectedType].matApplicable && <Tag>MAT</Tag>}
                  {ENTITY_TYPES[selectedType].transferPricingRisk && <Tag>Transfer Pricing</Tag>}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(3)} className="text-xs text-stone hover:text-carbon transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Edit details
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-saffron text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-opacity"
              >
                {submitting ? "Creating..." : "Create Entity"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", maxLength }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron transition-colors"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-stone uppercase tracking-wider">{label}</span>
      <span className="text-sm text-carbon font-medium">{value}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-2 py-1 rounded-full bg-carbon/5 text-carbon font-medium">{children}</span>
  );
}
