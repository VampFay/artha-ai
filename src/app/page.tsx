"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import AppShell from "@/components/app-shell";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { CursorSpotlight } from "@/components/motion/cursor-spotlight";
import { TiltCard } from "@/components/motion/tilt-card";
import { Loader2, ShieldCheck, ArrowRight, TrendingUp, Calculator, Sparkles, Lock, Mail, User } from "lucide-react";
import DashboardContent from "@/views/dashboard";
import TaxContent from "@/views/tax";
import FinanceContent from "@/views/finance";
import GoalsContent from "@/views/goals";
import AssistantContent from "@/views/assistant";
import ReportsContent from "@/views/reports";
import SettingsContent from "@/views/settings";
import DocumentsContent from "@/views/documents";
import DocumentVerifyContent from "@/views/document-verify";

export default function Home() {
  const { user, loading } = useAuth();
  const { page, navigate } = useNav();
  if (loading) return (
    <div className="min-h-screen relative flex items-center justify-center">
      <GradientMesh />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
            <span className="text-2xl font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
          </div>
          <motion.div className="absolute -inset-1 rounded-2xl" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.4) 0%, transparent 70%)" }} animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-forest)" }} />
      </motion.div>
    </div>
  );
  if (!user) return <LoginScreen />;
  return <AppShell><ConsentGate>{renderPage(page, navigate)}</ConsentGate></AppShell>;
}

function renderPage(page: string, navigate: (p: any, params?: any) => void) {
  const pages: Record<string, React.ReactNode> = { dashboard: <DashboardContent />, tax: <TaxContent />, finance: <FinanceContent />, goals: <GoalsContent />, assistant: <AssistantContent />, reports: <ReportsContent />, settings: <SettingsContent />, documents: <DocumentsContent />, "document-verify": <DocumentVerifyContent /> };
  return pages[page] || <DashboardContent />;
}

function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [text, setText] = useState("");
  const [accepting, setAccepting] = useState(false);
  useEffect(() => {
    if (!user) return; const t = localStorage.getItem("finsight_token");
    fetch("/api/consent", { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => setText(d.consent_text || "")).catch(() => {});
    fetch("/api/consent/history", { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(d => { setHasConsent(d.items?.some((c: any) => !c.revoked_at) || false); setChecked(true); }).catch(() => setChecked(true));
  }, [user]);
  const accept = async () => { setAccepting(true); try { const t = localStorage.getItem("finsight_token"); await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ consent_type: "document_processing", consent_text: text }) }); setHasConsent(true); } catch {} finally { setAccepting(false); } };
  if (!checked) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-forest)" }} /></div>;
  if (!hasConsent) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto pt-8">
      <TiltCard className="bento bento-light p-8" maxTilt={4}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center relative" style={{ background: "rgba(13,59,46,0.08)" }}>
            <ShieldCheck className="h-5 w-5" style={{ color: "var(--color-forest)" }} />
          </div>
          <div>
            <h2 className="text-heading">Your Consent</h2>
            <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Required before document processing</p>
          </div>
        </motion.div>
        <div className="rounded-xl p-4 mb-5" style={{ background: "var(--color-cream-dark)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>{text}</p>
        </div>
        <MagneticButton onClick={accept} disabled={accepting || !text} className="px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 shine-sweep" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", color: "var(--color-cream)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }}>
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" />Accept and Continue<ArrowRight className="h-4 w-4" /></>}
        </MagneticButton>
      </TiltCard>
    </motion.div>
  );
  return <>{children}</>;
}

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const doLogin = async () => {
    if (loading) return;
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err: any) {
      setError(err?.detail || "Something went wrong");
      setLoading(false);
    }
  };

  const features = [
    { icon: Calculator, title: "Old vs New regime", desc: "Auto-compare tax slabs and pick the best" },
    { icon: TrendingUp, title: "Financial Health Score", desc: "13-category insights with actionable tips" },
    { icon: ShieldCheck, title: "Privacy-first", desc: "Masked, encrypted, deletable on demand" },
  ];

  return (
    <div className="min-h-screen flex relative">
      <GradientMesh />
      <div className="relative z-10 flex w-full">
        {/* LEFT — editorial forest panel with kinetic hero */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
            style={{ background: "linear-gradient(155deg, #0d3b2e 0%, #062418 60%, #031711 100%)" }}
          />
          {/* Liquid morphing blobs */}
          {/* OPTIMIZED: Static radial gradients instead of 3 animated blur blobs */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(at 80% 20%, rgba(212,160,23,0.20) 0%, transparent 50%), radial-gradient(at 20% 80%, rgba(74,124,89,0.25) 0%, transparent 50%), radial-gradient(at 50% 50%, rgba(232,193,74,0.10) 0%, transparent 40%)" }} />

          {/* Dot grid overlay for tech feel */}
          <div className="absolute inset-0 dot-grid opacity-20" />

          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3 mb-20">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center relative" style={{ background: "rgba(250,247,242,0.08)", border: "1px solid rgba(212,160,23,0.3)" }}>
                <span className="text-lg font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
                <motion.div className="absolute -inset-0.5 rounded-xl" style={{ background: "radial-gradient(circle, rgba(212,160,23,0.4), transparent 70%)" }} animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} />
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--color-cream)" }}>FinSight AI</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ml-1 live-dot-pulse" style={{ background: "rgba(212,160,23,0.18)", color: "var(--color-gold-light)", border: "1px solid rgba(212,160,23,0.3)" }}>Beta</span>
            </motion.div>

            {/* Kinetic hero text */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="hero-text mb-6"
              style={{ color: "var(--color-cream)" }}
            >
              Your money,<br />
              <span className="kinetic-shimmer">finally clear.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-base leading-relaxed max-w-md"
              style={{ color: "rgba(250,247,242,0.65)" }}
            >
              AI-powered document extraction, tax readiness scores, and CA-ready reports — all privacy-first, all in 60 seconds.
            </motion.p>

            {/* Feature pills */}
            <div className="mt-12 space-y-3">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.12 }}
                    whileHover={{ x: 6 }}
                    className="flex items-center gap-3 group cursor-default"
                  >
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.2)" }}>
                      <Icon className="h-4 w-4" style={{ color: "var(--color-gold-light)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--color-cream)" }}>{f.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(250,247,242,0.55)" }}>{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live ticker tape at bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="relative z-10 -mx-12 -mb-12 px-12 py-4"
            style={{ background: "rgba(0,0,0,0.25)", borderTop: "1px solid rgba(212,160,23,0.15)" }}
          >
            <div className="marquee">
              <div className="ticker" style={{ animationDuration: "32s" }}>
                {[...Array(2)].flatMap((_, dup) =>
                  [
                    { label: "Tax Score", value: "94/100", trend: "up" as const },
                    { label: "Tax Saved", value: "₹90,740", trend: "up" as const },
                    { label: "Savings Rate", value: "28.5%", trend: "up" as const },
                    { label: "Health Score", value: "78/100", trend: "up" as const },
                    { label: "Documents", value: "12 verified", trend: "up" as const },
                  ].map((it, i) => (
                    <div key={`${dup}-${i}`} className="ticker-item text-xs">
                      <span className="opacity-50 uppercase tracking-wider text-[10px] font-semibold" style={{ color: "rgba(250,247,242,0.6)" }}>{it.label}</span>
                      <span className="font-bold ml-1.5" style={{ color: it.trend === "up" ? "var(--color-gold-light)" : "var(--color-clay-soft)" }}>▲ {it.value}</span>
                      <span className="opacity-20 mx-3" style={{ color: "rgba(250,247,242,0.4)" }}>|</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — form panel with spotlight */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <CursorSpotlight className="w-full max-w-sm" radius={300}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)", boxShadow: "0 4px 12px -3px rgba(13,59,46,0.4)" }}>
                  <span className="text-lg font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
                </div>
                <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--color-forest)" }}>FinSight AI</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-bold mb-2 kinetic"
                    style={{ color: "var(--color-ink)", letterSpacing: "-0.03em" }}
                  >
                    {mode === "login" ? "Welcome back" : "Create account"}
                  </motion.h2>
                  <p className="text-sm mb-8" style={{ color: "var(--color-ink-muted)" }}>
                    {mode === "login" ? "Sign in to access your dashboard" : "Start your financial journey today"}
                  </p>

                  <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} suppressHydrationWarning className="space-y-4">
                    {mode === "register" && (
                      <FormField label="Name" delay={0} icon={User}>
                        <input value={name} onChange={(e) => setName(e.target.value)} required suppressHydrationWarning placeholder="Your name" className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none glass-input" />
                      </FormField>
                    )}
                    <FormField label="Email" delay={mode === "register" ? 0.05 : 0} icon={Mail}>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required suppressHydrationWarning placeholder="you@example.com" className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none glass-input" />
                    </FormField>
                    <FormField label="Password" delay={mode === "register" ? 0.1 : 0.05} icon={Lock}>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} suppressHydrationWarning placeholder="Min 8 chars, 1 letter + 1 digit" className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none glass-input" />
                    </FormField>

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: "rgba(198,93,58,0.08)", color: "var(--color-clay)", border: "1px solid rgba(198,93,58,0.2)" }}>
                        <span>⚠</span>{error}
                      </motion.div>
                    )}

                    <MagneticButton
                      onClick={doLogin}
                      disabled={loading}
                      className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 relative overflow-hidden shine-sweep"
                      style={{ background: "linear-gradient(135deg, #0d3b2e 0%, #062418 100%)", color: "var(--color-cream)", boxShadow: "0 6px 20px -6px rgba(13,59,46,0.5), 0 1px 0 0 rgba(255,255,255,0.1) inset" }}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" /></>}
                    </MagneticButton>
                  </form>

                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
                    <span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>or</span>
                    <div className="flex-1 h-px" style={{ background: "var(--color-line)" }} />
                  </div>

                  <MagneticButton
                    onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                    className="w-full mt-4 text-sm font-medium py-3 rounded-xl transition-all"
                    style={{ color: "var(--color-forest)", background: "rgba(13,59,46,0.04)", border: "1px solid rgba(13,59,46,0.1)" }}
                  >
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <span className="font-bold underline underline-offset-4">{mode === "login" ? "Register" : "Sign in"}</span>
                  </MagneticButton>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 p-4 rounded-xl text-xs space-y-1.5" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.18)" }}>
                    <p className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--color-gold)" }}>Demo Accounts</p>
                    <div className="flex justify-between" style={{ color: "var(--color-ink-soft)" }}><span>Test:</span><span className="font-mono">test@finsight.ai / test1234</span></div>
                    <div className="flex justify-between" style={{ color: "var(--color-ink-soft)" }}><span>Admin:</span><span className="font-mono">admin@finsight.ai / admin1234</span></div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </CursorSpotlight>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, delay, icon: Icon, children }: { label: string; delay: number; icon: any; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}>
      <label className="text-label mb-2 block">{label}</label>
      <div className="relative">
        <Icon className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-ink-muted)" }} />
        {children}
      </div>
    </motion.div>
  );
}
