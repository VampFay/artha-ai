"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNav } from "@/lib/nav-context";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, UploadCloud, ShieldCheck, ArrowRight, X, TrendingUp, Calculator } from "lucide-react";

const STORAGE_KEY = "finsight_onboarding_complete";

export function OnboardingFlow() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const { navigate } = useNav();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Small delay so login animation finishes first
    const t = setTimeout(() => {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, [user]);

  const finish = (goToUpload: boolean) => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    if (goToUpload) navigate("documents");
  };

  const skip = () => {
    localStorage.setItem(STORAGE_KEY, "skipped");
    setOpen(false);
  };

  const screens = [
    {
      icon: Sparkles,
      title: `Welcome${user?.name ? ", " + user.name.split(" ")[0] : ""}`,
      subtitle: "Your money, finally clear.",
      body: "FinSight AI turns your documents into instant tax readiness scores, financial health insights, and CA-ready reports — all in 60 seconds.",
      cta: "Get Started",
      accent: "var(--color-gold)",
    },
    {
      icon: UploadCloud,
      title: "Upload a document",
      subtitle: "60 seconds to your first score",
      body: "Drop a salary slip, Form 16, or bank statement. Our AI extracts the fields automatically — no manual entry, no spreadsheets.",
      cta: "See How It Works",
      accent: "var(--color-forest)",
    },
    {
      icon: Calculator,
      title: "Get your Tax Readiness Score",
      subtitle: "Know exactly where you stand",
      body: "We compare Old vs New regime, detect missing documents, and show you exactly how much tax you could save.",
      cta: "Almost There",
      accent: "var(--color-moss)",
    },
    {
      icon: ShieldCheck,
      title: "Privacy-first, always",
      subtitle: "Your data stays yours",
      body: "Documents are masked, encrypted, and deletable on demand. You're in control — revoke consent anytime.",
      cta: "Start Using FinSight",
      accent: "var(--color-clay)",
    },
  ];

  const current = screens[step];
  const Icon = current.icon;
  const isLast = step === screens.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(10,10,10,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl overflow-hidden relative"
            style={{
              background: "linear-gradient(155deg, rgba(26,26,26,0.98) 0%, rgba(10,10,10,0.98) 100%)",
              border: "1px solid rgba(217,119,6,0.2)",
              boxShadow: "0 32px 80px -20px rgba(10,10,10,0.6)",
            }}
          >
            {/* Ambient glow */}
            <motion.div
              className="absolute -top-32 -right-32 w-72 h-72 rounded-full"
              style={{ background: `radial-gradient(circle, ${current.accent}40 0%, transparent 60%)`, filter: "blur(40px)" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(107,98,88,0.3) 0%, transparent 60%)", filter: "blur(40px)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Skip button */}
            <button
              onClick={skip}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors"
              style={{ color: "rgba(250,247,242,0.5)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--color-cream)"; e.currentTarget.style.background = "rgba(250,247,242,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(250,247,242,0.5)"; e.currentTarget.style.background = "transparent"; }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
                    className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6 relative"
                    style={{ background: `linear-gradient(135deg, ${current.accent}30, ${current.accent}15)`, border: `1px solid ${current.accent}40` }}
                  >
                    <Icon className="h-7 w-7" style={{ color: current.accent }} />
                    <motion.div
                      className="absolute -inset-1 rounded-2xl"
                      style={{ background: `radial-gradient(circle, ${current.accent}50, transparent 70%)` }}
                      animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Title */}
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: current.accent }}>
                    {current.subtitle}
                  </p>
                  <h2 className="text-3xl font-bold mb-4 kinetic" style={{ color: "var(--color-cream)", letterSpacing: "-0.02em" }}>
                    {current.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(250,247,242,0.6)" }}>
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center gap-2 mb-6">
                {screens.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className="transition-all"
                    style={{
                      width: i === step ? 24 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === step ? current.accent : "rgba(250,247,242,0.2)",
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => isLast ? finish(true) : setStep(s => s + 1)}
                  className="flex-1 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shine-sweep"
                  style={{ background: `linear-gradient(135deg, ${current.accent}, ${current.accent}cc)`, color: "var(--color-cream)" }}
                >
                  {current.cta}
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    className="h-12 px-4 rounded-xl text-sm font-medium"
                    style={{ color: "rgba(250,247,242,0.5)", border: "1px solid rgba(250,247,242,0.15)" }}
                  >
                    Back
                  </button>
                )}
              </div>

              <p className="text-[10px] text-center mt-4" style={{ color: "rgba(250,247,242,0.3)" }}>
                Step {step + 1} of {screens.length} · Skip anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
