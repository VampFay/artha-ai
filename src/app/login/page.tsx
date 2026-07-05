"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const loadingRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const doLogin = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);

      // Navigate using a hidden anchor click — most compatible with Safari iframes.
      // Avoids "Load failed" TypeError from window.location.assign/replace.
      // Avoids document.write() which clears localStorage.
      const a = document.createElement("a");
      a.href = "/dashboard";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err?.detail || "Something went wrong");
      setLoading(false);
      loadingRef.current = false;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
        <Card className="w-full max-w-md glass"><CardContent className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto" /></CardContent></Card>
      </div>
    );
  }

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
          <div className="text-center mt-3"><Link href="/" className="text-xs text-slate-400 hover:text-slate-600">Back to home</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}
