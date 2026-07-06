"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err: any) {
      setError(err?.detail || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-carbon text-canvas overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 bg-carbon">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-white shadow-lg shadow-saffron/20">A</div>
            <span className="font-semibold text-xl tracking-tight">Artha AI</span>
          </div>
          <h1 className="text-5xl font-serif italic tracking-tight leading-[1.1] max-w-xl text-canvas">
            Your money,<br />
            <span className="text-saffron">finally clear.</span>
          </h1>
          <div className="mt-16 flex flex-col gap-6">
            {["Old vs New regime", "Financial Health Score", "Privacy-first"].map((pill, i) => (
              <motion.div key={pill} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-3 group cursor-default">
                <div className="w-1.5 h-1.5 rounded-full bg-saffron opacity-50 group-hover:opacity-100 group-hover:scale-150 transition-all duration-300" />
                <span className="text-lg text-stone group-hover:text-canvas transition-colors duration-300">{pill}</span>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 border-t border-carbon-light bg-carbon/50 overflow-hidden flex items-center">
          <motion.div animate={{ x: [0, -800] }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="flex whitespace-nowrap gap-12 text-sm font-mono text-stone">
            {[...Array(3)].map((_, dup) => (
              <React.Fragment key={dup}>
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-saffron" /> Tax Score: 85/100</span>
                <span>Tax Saved: ₹42,500</span>
                <span>Savings Rate: 24%</span>
                <span>Health Score: Good</span>
                <span>Documents: 4 Processed</span>
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-canvas text-carbon">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-white">A</div>
            <span className="font-semibold text-xl tracking-tight">Artha AI</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-semibold tracking-tight">{mode === "login" ? "Welcome back" : "Create an account"}</h2>
            <p className="text-stone mt-2">{mode === "login" ? "Enter your details to access your dashboard." : "Sign up to get your financial clarity."}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-crimson/10 border border-crimson/20 flex items-start gap-3">
              <span className="text-crimson mt-0.5">⚠️</span>
              <p className="text-sm text-crimson font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-carbon-light">Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-shadow placeholder:text-stone/40" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-carbon-light">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-shadow placeholder:text-stone/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-carbon-light">Password</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, 1 letter + 1 digit" suppressHydrationWarning className="w-full px-4 py-3 rounded-xl border border-stone/20 bg-white focus:outline-none focus:ring-2 focus:ring-saffron/50 transition-shadow placeholder:text-stone/40" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-2 relative overflow-hidden group rounded-xl bg-carbon text-canvas px-4 py-3.5 font-medium transition-transform active:scale-[0.98] flex items-center justify-center h-12 disabled:opacity-60">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-stone" /> : <span className="relative z-10">{mode === "login" ? "Sign In" : "Create Account"}</span>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-sm text-stone hover:text-carbon transition-colors">
              {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-12 p-5 rounded-2xl bg-saffron/5 border border-saffron/10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-saffron" />
              <h3 className="text-sm font-medium text-carbon">Demo Accounts</h3>
            </div>
            <div className="space-y-2 text-sm font-mono text-stone">
              <div className="flex justify-between"><span>test@finsight.ai</span><span>test1234</span></div>
              <div className="flex justify-between"><span>admin@finsight.ai</span><span>admin1234</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
