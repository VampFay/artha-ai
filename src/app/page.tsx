"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, ShieldCheck, Calculator } from "lucide-react";

// Dashboard
import DashboardContent from "@/views/dashboard";
import TaxContent from "@/views/tax";
import FinanceContent from "@/views/finance";
import GoalsContent from "@/views/goals";
import AssistantContent from "@/views/assistant";
import ReportsContent from "@/views/reports";
import SettingsContent from "@/views/settings";
import DocumentsContent from "@/views/documents";
import DocumentVerifyContent from "@/views/document-verify";
import ConsentContent from "@/views/consent";

export default function Home() {
  const { user, loading } = useAuth();
  const { page, navigate } = useNav();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  // Not logged in → show login page
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in but no consent → show consent
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

// Consent gate — checks if user has consent, if not shows consent screen
function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch("/api/consent", { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } })
      .then(r => r.json()).then(d => setConsentText(d.consent_text || "")).catch(() => {});
    fetch("/api/consent/history", { headers: { Authorization: `Bearer ${localStorage.getItem("finsight_token")}` } })
      .then(r => r.json()).then(d => {
        setHasConsent(d.items?.some((c: any) => c.consent_type === "document_processing" && !c.revoked_at) || false);
        setConsentChecked(true);
      }).catch(() => { setConsentChecked(true); });
  }, [user]);

  const handleAccept = async () => {
    setAccepting(true); setError("");
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("finsight_token")}` },
        body: JSON.stringify({ consent_type: "document_processing", consent_text: consentText }),
      });
      setHasConsent(true);
    } catch { setError("Failed to accept consent"); }
    finally { setAccepting(false); }
  };

  if (!consentChecked) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  if (!hasConsent) {
    return (
      <div className="max-w-2xl mx-auto pt-8">
        <Card className="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
              <div><CardTitle className="text-xl">Your Consent</CardTitle><p className="text-xs text-slate-400">Required before document processing</p></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5"><p className="text-sm text-slate-600 leading-relaxed">{consentText}</p></div>
            <p className="text-xs text-slate-400 mb-5">You can revoke this consent at any time from Settings.</p>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button onClick={handleAccept} disabled={accepting || !consentText} className="bg-emerald-500 hover:bg-emerald-600">{accepting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Accepting...</> : "Accept and Continue"}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Login screen — no navigation, just state change
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
      // No navigation needed — AuthProvider state change triggers re-render
      // The `if (!user)` check above will now show the dashboard
    } catch (err: any) {
      setError(err?.detail || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl" />
      <Card className="w-full max-w-md glass animate-scale-in relative">
        <CardHeader className="text-center pb-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mx-auto mb-3">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <CardTitle className="text-xl">FinSight AI</CardTitle>
          <p className="text-sm text-slate-500">{mode === "login" ? "Welcome back" : "Create your account"}</p>
        </CardHeader>
        <CardContent>
          <div className="flex border-b border-slate-200 mb-6">
            <button type="button" onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "login" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-slate-400"}`}>Login</button>
            <button type="button" onClick={() => { setMode("register"); setError(""); }} className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === "register" ? "text-emerald-600 border-b-2 border-emerald-500" : "text-slate-400"}`}>Register</button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} suppressHydrationWarning>
            {mode === "register" && (
              <div className="space-y-1.5 mb-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required suppressHydrationWarning className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
              </div>
            )}
            <div className="space-y-1.5 mb-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" suppressHydrationWarning className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
            </div>
            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 chars, 1 letter + 1 digit" suppressHydrationWarning className="flex h-10 w-full rounded-lg border border-slate-200 bg-white/50 px-3 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
            </div>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button type="button" onClick={doLogin} disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Please wait...</> : mode === "login" ? "Login" : "Create account"}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-emerald-50/50 rounded-lg text-xs text-slate-600 space-y-1 border border-emerald-100">
            <p className="font-semibold text-slate-700">Demo Accounts:</p>
            <p>Test: test@finsight.ai / test1234</p>
            <p>Admin: admin@finsight.ai / admin1234</p>
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">By continuing you agree to our privacy policy.</p>
        </CardContent>
      </Card>
    </div>
  );
}
