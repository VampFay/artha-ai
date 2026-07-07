"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, ShieldCheck, Loader2, ArrowRight, TrendingUp, Calculator } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LiveVideoLoop } from "@/components/LiveVideoLoop";

const DEMO_ACCOUNTS = [
  { label: "Test User", email: "test@finsight.ai", password: "test1234" },
  { label: "Admin User", email: "admin@finsight.ai", password: "admin1234" },
];

export default function LoginScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err: any) {
      setError(err?.detail || "Authentication failed");
      setIsLoading(false);
    }
  };

  const quickFill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setMode("login");
    setError("");
  };

  const LIVE_STATS = [
    { label: "TOTAL NET WORTH", value: "₹1.42 Cr", change: "+12.4%", positive: true },
    { label: "TAX READINESS", value: "90/100", change: "₹90,740 saved", positive: true },
    { label: "FINANCIAL HEALTH", value: "70/100", change: "Stable", positive: true },
  ];

  const FEATURES = [
    { icon: Calculator, title: "Old vs New regime", desc: "Auto-compare tax slabs and pick the best" },
    { icon: TrendingUp, title: "Financial Health Score", desc: "13-category insights with actionable tips" },
    { icon: ShieldCheck, title: "Privacy-first", desc: "Masked, encrypted, deletable on demand" },
  ];

  return (
    <div className="min-h-screen flex w-full bg-black text-white overflow-hidden">
      {/* ============ LEFT PANEL (Desktop only) ============ */}
      <div className="hidden lg:flex flex-1 relative flex-col justify-between p-12 bg-black">
        {/* Canvas background */}
        <LiveVideoLoop />

        {/* Content overlay */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-lg bg-saffron flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-saffron/20">A</div>
            <div>
              <span className="font-semibold text-xl tracking-tight">Artha AI</span>
              <p className="text-[9px] font-bold tracking-[0.2em] text-stone uppercase">Wealth Intelligence</p>
            </div>
          </div>

          {/* Hero heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] mb-4"
          >
            Your money,<br />
            <span className="text-saffron">finally clear.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-base text-stone-light max-w-md mb-12"
          >
            AI-powered document extraction, tax readiness scores, and CA-ready reports — all privacy-first, all in 60 seconds.
          </motion.p>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-6 max-w-md">
            {LIVE_STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              >
                <p className="text-[9px] font-bold tracking-[0.15em] text-stone uppercase mb-1">{stat.label}</p>
                <p className="text-xl font-mono font-bold text-white">{stat.value}</p>
                <p className={`text-[10px] font-mono mt-0.5 ${stat.positive ? "text-emerald" : "text-crimson"}`}>
                  {stat.positive ? "▲" : "▼"} {stat.change}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: Status + features */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <span className="live-dot" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-emerald uppercase">All Systems Operational</span>
          </div>
          <div className="space-y-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{f.title}</p>
                    <p className="text-xs text-stone">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL (Form) ============ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8 bg-black relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-lg bg-saffron flex items-center justify-center font-bold text-black text-lg">A</div>
            <span className="font-semibold text-xl">Artha AI</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, filter: "blur(4px)", x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", x: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-stone mb-8">
                {mode === "login" ? "Sign in to access your dashboard" : "Start your financial journey today"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                {mode === "register" && (
                  <div>
                    <label className="text-[10px] font-bold tracking-[0.1em] text-stone uppercase mb-1.5 block">Name</label>
                    <input
                      type="text" required value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name" suppressHydrationWarning
                      className="w-full h-12 rounded-xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-stone/50 transition-all focus:border-saffron/50 focus:bg-white/10"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold tracking-[0.1em] text-stone uppercase mb-1.5 block">Email</label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" suppressHydrationWarning
                    className="w-full h-12 rounded-xl px-4 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-stone/50 transition-all focus:border-saffron/50 focus:bg-white/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold tracking-[0.1em] text-stone uppercase mb-1.5 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required minLength={8} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 letter + 1 digit" suppressHydrationWarning
                      className="w-full h-12 rounded-xl px-4 pr-12 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-stone/50 transition-all focus:border-saffron/50 focus:bg-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone hover:text-white transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Animated error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-xl bg-crimson/10 border border-crimson/20 flex items-start gap-2">
                        <span className="text-crimson text-sm">⚠</span>
                        <p className="text-sm text-crimson">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-saffron text-black hover:bg-saffron-light transition-colors disabled:opacity-60"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-stone">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="w-full mt-4 text-sm font-medium py-3 rounded-xl text-stone hover:text-white hover:bg-white/5 transition-all"
              >
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <span className="font-bold text-saffron">{mode === "login" ? "Register" : "Sign in"}</span>
              </button>

              {/* Demo quick-fill buttons */}
              <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] font-bold tracking-[0.1em] text-stone uppercase mb-2">Demo Quick-Fill</p>
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => quickFill(acc)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{acc.label}</p>
                      <p className="text-[10px] font-mono text-stone">{acc.email}</p>
                    </div>
                    <span className="text-[10px] font-mono text-saffron">{acc.password}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
