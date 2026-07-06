"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import AppShell from "@/components/app-shell";
import { Loader2, ShieldCheck, ArrowRight, TrendingUp, Calculator } from "lucide-react";

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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-forest)" }} /></div>;
  if (!user) return <LoginScreen />;

  return (
    <AppShell>
      <ConsentGate>
        {renderPage(page, navigate)}
      </ConsentGate>
    </AppShell>
  );
}

function renderPage(page: string, navigate: (p: any, params?: any) => void) {
  switch (page) {
    case "dashboard": return <DashboardContent />;
    case "tax": return <TaxContent />;
    case "finance": return <FinanceContent />;
    case "goals": return <GoalsContent />;
    case "assistant": return <AssistantContent />;
    case "reports": return <ReportsContent />;
    case "settings": return <SettingsContent />;
    case "documents": return <DocumentsContent />;
    case "document-verify": return <DocumentVerifyContent />;
    default: return <DashboardContent />;
  }
}

function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("finsight_token");
    fetch("/api/consent", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setConsentText(d.consent_text || "")).catch(() => {});
    fetch("/api/consent/history", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { setHasConsent(d.items?.some((c: any) => c.consent_type === "document_processing" && !c.revoked_at) || false); setConsentChecked(true); }).catch(() => setConsentChecked(true));
  }, [user]);

  const handleAccept = async () => {
    setAccepting(true);
    try { const token = localStorage.getItem("finsight_token"); await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ consent_type: "document_processing", consent_text: consentText }) }); setHasConsent(true); } catch {}
    finally { setAccepting(false); }
  };

  if (!consentChecked) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-forest)" }} /></div>;
  if (!hasConsent) return (
    <div className="max-w-xl mx-auto pt-8">
      <div className="card p-8 animate-scale-in">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(13, 59, 46, 0.08)" }}><ShieldCheck className="h-5 w-5" style={{ color: "var(--color-forest)" }} /></div>
          <div><h2 className="text-heading">Your Consent</h2><p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>Required before document processing</p></div>
        </div>
        <div className="rounded-lg p-4 mb-5" style={{ background: "var(--color-cream-dark)" }}><p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-soft)" }}>{consentText}</p></div>
        <p className="text-xs mb-5" style={{ color: "var(--color-ink-muted)" }}>You can revoke this consent at any time from Settings.</p>
        <button onClick={handleAccept} disabled={accepting || !consentText} className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>
          {accepting ? "Accepting..." : "Accept and Continue"}
        </button>
      </div>
    </div>
  );
  return <>{children}</>;
}

function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const doLogin = async () => {
    if (loading) return; setError(""); setLoading(true);
    try {
      if (mode === "login") await login(email, password); else await register(name, email, password);
    } catch (err: any) { setError(err?.detail || "Something went wrong"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-cream)" }}>
      {/* Left panel — editorial */}
      <div className="hidden lg:flex w-2/5 flex-col justify-between p-12" style={{ background: "var(--color-forest)" }}>
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(250, 247, 242, 0.1)" }}><span className="text-lg font-bold" style={{ color: "var(--color-cream)" }}>F</span></div>
            <span className="text-lg font-semibold" style={{ color: "var(--color-cream)" }}>FinSight AI</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "var(--color-cream)", letterSpacing: "-0.03em" }}>Your finances, clearly understood.</h1>
          <p className="text-base leading-relaxed max-w-md" style={{ color: "rgba(250, 247, 242, 0.7)" }}>Upload your documents. FinSight AI extracts the data, estimates your tax readiness, and generates a CA-ready report — all privacy-first.</p>
        </div>
        <div className="space-y-4">
          {[{ icon: Calculator, text: "Old vs New tax regime comparison" }, { icon: TrendingUp, text: "Financial health score with insights" }, { icon: ShieldCheck, text: "Your data is masked and deletable" }].map((f, i) => {
            const Icon = f.icon;
            return <div key={i} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 100 + 200}ms` }}>
              <Icon className="h-4 w-4" style={{ color: "var(--color-gold)" }} /><span className="text-sm" style={{ color: "rgba(250, 247, 242, 0.8)" }}>{f.text}</span>
            </div>;
          })}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-forest)" }}><span className="text-lg font-bold" style={{ color: "var(--color-cream)" }}>F</span></div>
            <span className="text-lg font-semibold" style={{ color: "var(--color-ink)" }}>FinSight AI</span>
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ink)", letterSpacing: "-0.02em" }}>{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="text-sm mb-8" style={{ color: "var(--color-ink-muted)" }}>{mode === "login" ? "Sign in to access your dashboard" : "Start your financial journey"}</p>

          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} suppressHydrationWarning className="space-y-4">
            {mode === "register" && (
              <div><label className="text-label mb-1.5 block">Name</label><input value={name} onChange={(e) => setName(e.target.value)} required suppressHydrationWarning className="w-full h-11 rounded-lg border px-3.5 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={(e) => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} /></div>
            )}
            <div><label className="text-label mb-1.5 block">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" suppressHydrationWarning className="w-full h-11 rounded-lg border px-3.5 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={(e) => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} /></div>
            <div><label className="text-label mb-1.5 block">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 letter + 1 digit" suppressHydrationWarning className="w-full h-11 rounded-lg border px-3.5 text-sm outline-none transition-all" style={{ borderColor: "var(--color-line)", background: "var(--color-surface)" }} onFocus={(e) => { e.target.style.borderColor = "var(--color-forest)"; e.target.style.boxShadow = "0 0 0 3px rgba(13,59,46,0.08)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--color-line)"; e.target.style.boxShadow = "none"; }} /></div>
            {error && <div className="rounded-lg p-3 text-sm" style={{ background: "rgba(198, 93, 58, 0.08)", color: "var(--color-clay)" }}>{error}</div>}
            <button type="button" onClick={doLogin} disabled={loading} className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3"><div className="flex-1 divider" /><span className="text-xs" style={{ color: "var(--color-ink-muted)" }}>or</span><div className="flex-1 divider" /></div>
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full mt-4 text-sm font-medium transition-colors" style={{ color: "var(--color-forest)" }}>
            {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </button>

          <div className="mt-6 p-3 rounded-lg text-xs space-y-1" style={{ background: "var(--color-cream-dark)", color: "var(--color-ink-soft)" }}>
            <p className="font-semibold" style={{ color: "var(--color-ink)" }}>Demo Accounts</p>
            <p>Test: test@finsight.ai / test1234</p>
            <p>Admin: admin@finsight.ai / admin1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}
