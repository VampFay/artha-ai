"use client";
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Loader2, ArrowRight, Activity, Sparkles, CheckCircle2, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { Building2, User } from "lucide-react";

const NOISE_SVG_URL = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")';

const LiveVideoLoop = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, z: number, vx: number, vy: number, symbol: string }[] = [];
    const currencies = ["$", "€", "£", "¥", "₹", "₽", "₩", "฿", "₪"];
    const mouse = { x: -1000, y: -1000, isActive: false };

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        init();
      }
    };

    const init = () => {
      particles = [];
      const num = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 1.2) * 0.4,
          symbol: currencies[Math.floor(Math.random() * currencies.length)],
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isActive = true;
    };
    const handleMouseLeave = () => { mouse.isActive = false; mouse.x = -1000; mouse.y = -1000; };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseLeave);
    resize();

    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 10, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) { p.x += (dx / dist) * 1.5; p.y += (dy / dist) * 1.5; }
        }
        if (p.y < -50) { p.y = canvas.height + 50; p.x = Math.random() * canvas.width; }
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.35;
            const heightRatio = particles[i].y / canvas.height;
            const r = Math.floor(245 * (1 - heightRatio) + 16 * heightRatio);
            const g = Math.floor(158 * (1 - heightRatio) + 185 * heightRatio);
            const b = Math.floor(11 * (1 - heightRatio) + 129 * heightRatio);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        if (mouse.isActive) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) {
            const opacity = (1 - dist / 250) * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      particles.forEach(p => {
        ctx.font = `${Math.floor(12 + p.z * 5)}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + p.z * 0.35})`;
        ctx.fillText(p.symbol, p.x, p.y);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.8)_100%)] pointer-events-none" />
    </div>
  );
});

/**
 * Rotating content carousel for the login screen left panel.
 * Cycles through multiple sets of useful, informative content
 * with smooth AnimatePresence transitions.
 */

interface CarouselSlide {
  icon: React.ReactNode;
  label: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: "emerald" | "saffron" | "blue";
}

const ENTITY_SLIDES: CarouselSlide[] = [
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "TAX ENGINE",
    title: "CIT · GST · TDS · TCS",
    subtitle: "14 tax types computed automatically",
    tag: "§115BAA → 25.17%",
    tagColor: "emerald",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-saffron" />,
    label: "COMPLIANCE",
    title: "29 Filing Types",
    subtitle: "ITR · GSTR · TDS · MCA · RERA · RBI",
    tag: "Auto-generated calendar",
    tagColor: "saffron",
  },
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "ENTITY COVERAGE",
    title: "30 Entity Types",
    subtitle: "Banks → NBFCs → Universities → Trusts → MSMEs",
    tag: "RBI · IRDAI · UGC · MCA",
    tagColor: "emerald",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-saffron" />,
    label: "BANK-GRADE SECURITY",
    title: "AES-256-GCM + KMS",
    subtitle: "Field-level PII encryption · Hash-chained audit",
    tag: "SOC 2 · ISO 27001 · DPDP",
    tagColor: "saffron",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
    label: "AI TAX ADVISOR",
    title: "GLM-Powered Insights",
    subtitle: "Regime optimization · ITC planning · TP risk",
    tag: "Proactive alerts + peer benchmarking",
    tagColor: "blue",
  },
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "CORE BANKING",
    title: "Flexcube · Finacle · BaNCS",
    subtitle: "Bi-directional sync with adapter pattern",
    tag: "RBI returns · GL export · transaction import",
    tagColor: "emerald",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-saffron" />,
    label: "DTAA + TRANSFER PRICING",
    title: "10 Countries · 5 TP Methods",
    subtitle: "Withholding rate lookup · Form 3CEB · Safe Harbour",
    tag: "PE detection · penalty computation",
    tagColor: "saffron",
  },
];

const INDIVIDUAL_SLIDES: CarouselSlide[] = [
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "TAX READINESS",
    title: "Auto-detect Form 16 + AIS",
    subtitle: "PAN · Aadhaar · bank statements · rent receipts",
    tag: "Old vs New regime comparison",
    tagColor: "emerald",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-saffron" />,
    label: "WEALTH SCORE",
    title: "0-100 Health Score",
    subtitle: "Savings rate · debt-to-income · emergency fund",
    tag: "Real-time financial health check",
    tagColor: "saffron",
  },
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "PORTFOLIO ANALYTICS",
    title: "Asset Allocation Tracking",
    subtitle: "Equity · Debt · Real Estate · Gold · Crypto",
    tag: "Rebalancing suggestions",
    tagColor: "emerald",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-blue-400" />,
    label: "AI ASSISTANT",
    title: "Ask Artha Oracle",
    subtitle: "Tax-saving strategies · investment advice",
    tag: "Powered by GLM-4.6V",
    tagColor: "blue",
  },
  {
    icon: <ShieldCheck className="w-4 h-4 text-saffron" />,
    label: "RETIREMENT PLANNING",
    title: "FIRE Calculator",
    subtitle: "Project corpus · withdrawal rate · timeline",
    tag: "Monte Carlo simulation",
    tagColor: "saffron",
  },
  {
    icon: <Activity className="w-4 h-4 text-emerald-400" />,
    label: "ESTATE PLANNING",
    title: "Nominee Management",
    subtitle: "Will · Trust · Power of Attorney · Asset mapping",
    tag: "Succession planning",
    tagColor: "emerald",
  },
];

const tagColorClasses: Record<string, string> = {
  emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  saffron: "text-saffron bg-saffron/10 border-saffron/20",
  blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

export default function LoginScreen() {
  const { toast } = useToast();
  const { login, register } = useAuth();
  const { mode: portalMode, setMode: setPortalMode, hydrated } = usePortal();
  const { navigate } = useNav();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Rotating carousel state
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = effectiveMode === "entities" ? ENTITY_SLIDES : INDIVIDUAL_SLIDES;
  const currentSlide = slides[slideIndex % slides.length];

  // Auto-rotate slides every 4 seconds
  useEffect(() => {
    setSlideIndex(0); // reset when mode changes
    const interval = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [effectiveMode, slides.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      // After successful auth, route to the selected portal.
      // The AppShell renders based on the nav page; we set the landing page here.
      if (effectiveMode === "entities") {
        navigate("entity-switcher");
      } else {
        navigate("dashboard");
      }
    } catch (err: any) {
      // Don't show "Session expired" on the login screen — that's misleading.
      // The real issue is invalid credentials (the API returns 401 for wrong email/password).
      const detail = err?.detail || "";
      if (detail === "Session expired" || err?.status === 401) {
        setError(
          effectiveMode === "entities"
            ? "Invalid email or password. Contact your entity admin if you've forgotten your credentials."
            : "Invalid email or password. Try the demo credentials below."
        );
      } else if (detail === "Network error") {
        setError("Cannot connect to server. Please check your connection.");
      } else {
        setError(detail || "Authentication failed");
      }
      setIsLoading(false);
    }
  };

  // Clear error when user starts typing or switches mode
  const handleEmailChange = (v: string) => { setEmail(v); if (error) setError(""); };
  const handlePasswordChange = (v: string) => { setPassword(v); if (error) setError(""); };
  const handleNameChange = (v: string) => { setName(v); if (error) setError(""); };

  // Use "individual" as default until hydrated to prevent SSR/client mismatch.
  // After hydration, use the actual portalMode from localStorage.
  const effectiveMode = hydrated ? portalMode : "individual";

  return (
    <div className="min-h-screen flex w-full bg-black text-white font-sans overflow-hidden">
      {/* Version stamp — visible in bottom-right corner to verify which version is served */}
      <div className="fixed bottom-2 right-2 z-50 text-[8px] text-white/20 font-mono pointer-events-none select-none">
        v2.0-portal-toggle
      </div>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-20 relative">
        <LiveVideoLoop />
        <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: NOISE_SVG_URL }} />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-[#111] text-xl font-sans shadow-[0_0_20px_rgba(245,158,11,0.3)]">A</div>
          <span className="font-michroma text-2xl tracking-widest uppercase text-white">ARTHA</span>
        </div>

        {/* Center Dynamic Content */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto pt-8">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key={`login-content-${effectiveMode}`}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-5xl xl:text-7xl font-light tracking-tighter text-white mb-10 leading-[1.05]">
                  {effectiveMode === "entities" ? (
                    <>Institutional tax<br /><span className="font-geist-pixel text-saffron tracking-tight">intelligence.</span></>
                  ) : (
                    <>Master your wealth. <br /><span className="font-geist-pixel text-saffron tracking-tight">Without the noise.</span></>
                  )}
                </h1>
                <div className="grid grid-cols-2 gap-5">
                  {/* Card 1 — Rotating featured content */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                          {currentSlide.label}
                        </p>
                        {currentSlide.icon}
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={slideIndex}
                          initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <h3 className="text-2xl font-geist-pixel text-white tracking-tighter leading-tight">
                            {currentSlide.title}
                          </h3>
                          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                            {currentSlide.subtitle}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Card 2 — Rotating tag content */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                          FEATURED
                        </p>
                        <Sparkles className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={slideIndex}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          <h3 className="text-2xl font-geist-pixel text-white tracking-tighter leading-tight">
                            {currentSlide.tag}
                          </h3>
                          <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 w-fit px-2.5 py-1 rounded-full border ${tagColorClasses[currentSlide.tagColor]}`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Card 3 — Progress indicator + full-width chart */}
                  <div className="col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group relative">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500 overflow-hidden">
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">
                            {effectiveMode === "entities" ? "PLATFORM CAPABILITY" : "WEALTH INTELLIGENCE"}
                          </p>
                          <div className="flex items-baseline gap-3">
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={slideIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                                className="text-xl font-sans font-medium text-white tracking-tight"
                              >
                                {currentSlide.subtitle}
                              </motion.span>
                            </AnimatePresence>
                          </div>
                          {/* Slide indicator dots */}
                          <div className="flex gap-1.5 mt-4">
                            {slides.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSlideIndex(i)}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  i === slideIndex % slides.length
                                    ? "w-8 bg-saffron"
                                    : "w-2 bg-white/20 hover:bg-white/40"
                                }`}
                                aria-label={`Go to slide ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        <Sparkles className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors duration-500" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-40 group-hover:opacity-70 transition-opacity duration-500">
                        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
                          <defs>
                            <linearGradient id="chart-grad-1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,20" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                          <path d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,20 L400,100 L0,100 Z" fill="url(#chart-grad-1)" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-content"
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-5xl xl:text-7xl font-light tracking-tighter text-white mb-10 leading-[1.05]">
                  Institutional logic. <br />
                  <span className="font-geist-pixel text-saffron tracking-tight">For personal wealth.</span>
                </h1>
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Global Integration</p>
                        <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-geist-pixel text-white tracking-tighter leading-tight">12,000+</h3>
                      <p className="text-stone-400 text-xs mt-3 font-medium">Supported Institutions</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Data Security</p>
                        <ShieldCheck className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-geist-pixel text-white tracking-tighter leading-tight">SOC2</h3>
                      <p className="text-stone-400 text-xs mt-3 font-medium">Bank-grade encryption</p>
                    </div>
                  </div>
                  <div className="col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group relative">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">Automated Optimization</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-sans font-medium text-white tracking-tight">Always On</span>
                            <span className="text-sm font-geist-pixel text-saffron">24/7</span>
                          </div>
                        </div>
                        <Sparkles className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center pt-6 mt-8 border-t border-white/5">
          <p className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Institutional Grade Infrastructure</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-geist-pixel text-stone-400">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Right Panel (Auth Form) */}
      <div className="w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 bg-[#050505] border-l border-white/5 z-10 flex flex-col justify-center px-8 lg:px-16 relative overflow-y-auto max-h-screen" suppressHydrationWarning>
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: NOISE_SVG_URL }} />

        <div className="lg:hidden flex items-center gap-3 mb-8 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-[#111] text-xl font-sans shadow-[0_0_20px_rgba(245,158,11,0.3)]">A</div>
          <span className="font-michroma text-2xl tracking-widest uppercase text-white">ARTHA</span>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10 py-8">
          {/* Portal Mode Toggle — Individual vs Entities */}
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/5 rounded-2xl">
              <button
                type="button"
                onClick={() => { setPortalMode("individual"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  effectiveMode === "individual"
                    ? "bg-white text-[#111] shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" /> Individual
              </button>
              <button
                type="button"
                onClick={() => { setPortalMode("entities"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  effectiveMode === "entities"
                    ? "bg-saffron text-[#111] shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> Entities
              </button>
            </div>
            <p className="text-center text-[10px] text-stone-500 mt-2 tracking-wider">
              {effectiveMode === "individual"
                ? "Personal wealth intelligence"
                : "For companies, banks, govt, universities & more"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20, filter: "blur(4px)" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-6">
                <h2 className="text-3xl font-light tracking-tight mb-2 text-white">
                  {mode === "login"
                    ? (effectiveMode === "entities" ? "Welcome back." : "Welcome back.")
                    : (effectiveMode === "entities" ? "Register your entity." : "Join Artha.")}
                </h2>
                <p className="text-stone-400 font-medium text-sm">
                  {mode === "login"
                    ? (effectiveMode === "entities"
                        ? "Sign in to manage your entities, taxes & compliance."
                        : "Sign in to access your intelligence dashboard.")
                    : (effectiveMode === "entities"
                        ? "Create an account to onboard your first entity."
                        : "Create an account to unify your wealth.")}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
                {mode === "register" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500 ml-1">
                      {effectiveMode === "entities" ? "Admin Full Name" : "Legal Name"}
                    </label>
                    <input type="text" required value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder={effectiveMode === "entities" ? "Rajesh Kumar (Entity Admin)" : "Jane Doe"} suppressHydrationWarning className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all shadow-inner" />
                    {effectiveMode === "entities" && (
                      <p className="text-[9px] text-stone-600 ml-1 mt-1">You'll onboard your entity (company/bank/university/etc.) after registration.</p>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500 ml-1">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="you@domain.com" suppressHydrationWarning className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Security Key</label>
                    {mode === "login" && <span onClick={() => toast({ title: "Password reset unavailable", description: "Use the demo credentials below." })} className="text-[10px] font-bold tracking-wider text-saffron uppercase cursor-pointer hover:text-saffron-light transition-colors">Forgot?</span>}
                  </div>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => handlePasswordChange(e.target.value)} placeholder="••••••••" suppressHydrationWarning className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all tracking-widest shadow-inner pr-12" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full mt-8 bg-white text-[#111] py-4 px-6 rounded-xl font-bold tracking-widest uppercase text-xs transition-transform active:scale-[0.98] hover:bg-stone-200 flex items-center justify-center group h-14 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#111]" /> : <span className="flex items-center gap-3 relative z-10">{mode === "login" ? "Authenticate" : "Initialize Account"}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#111]" /></span>}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="text-[11px] font-bold tracking-wider text-stone-400 uppercase hover:text-white transition-colors">
                  {mode === "login"
                    ? (effectiveMode === "entities" ? "New here? Register your entity" : "New to Artha? Apply for Access")
                    : "Existing Member? Sign In"}
                </button>
              </div>

              {mode === "login" && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500 mb-4 ml-1">
                    {effectiveMode === "entities" ? "Demo Entity Account" : "Demo Credentials"}
                  </p>
                  <div className="space-y-3">
                    {effectiveMode === "individual" ? (
                      <>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/5 group" onClick={() => { setEmail("test@finsight.ai"); setPassword("test1234"); setError(""); }}>
                          <span className="text-sm font-medium text-stone-400 group-hover:text-white transition-colors">test@finsight.ai</span>
                          <span className="text-xs font-geist-pixel text-stone-500 bg-black px-2 py-1 rounded border border-white/10 group-hover:border-white/20 transition-colors">test1234</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/5 group" onClick={() => { setEmail("admin@finsight.ai"); setPassword("admin1234"); setError(""); }}>
                          <span className="text-sm font-medium text-stone-400 group-hover:text-white transition-colors">admin@finsight.ai</span>
                          <span className="text-xs font-geist-pixel text-stone-500 bg-black px-2 py-1 rounded border border-white/10 group-hover:border-white/20 transition-colors">admin1234</span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Platform Admin — sees all 15 entities */}
                        <div className="flex justify-between items-center p-3 rounded-xl bg-saffron/[0.05] hover:bg-saffron/[0.1] cursor-pointer transition-colors border border-saffron/20 group" onClick={() => { setEmail("admin@finsight.ai"); setPassword("admin1234"); setError(""); }}>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-white block">admin@finsight.ai</span>
                            <span className="text-[9px] text-saffron/70 uppercase tracking-wider">Platform Admin · All 15 entities</span>
                          </div>
                          <span className="text-xs font-geist-pixel text-saffron bg-black px-2 py-1 rounded border border-saffron/30 group-hover:border-saffron/50 transition-colors">admin1234</span>
                        </div>

                        {/* Per-entity logins — each institution has own creds */}
                        <p className="text-[9px] font-bold tracking-widest uppercase text-stone-500 mt-4 mb-2 ml-1">Individual Institution Logins:</p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {[
                            { icon: "🏦", name: "HDFC Bank", email: "admin@hdfc.artha.ai", pass: "hdfc1234" },
                            { icon: "💳", name: "Bajaj Finance", email: "admin@bajaj.artha.ai", pass: "bajaj1234" },
                            { icon: "🛡️", name: "LIC of India", email: "admin@lic.artha.ai", pass: "lic1234" },
                            { icon: "💻", name: "Acme Software", email: "admin@acme.artha.ai", pass: "acme1234" },
                            { icon: "🏭", name: "Bharat Steel", email: "admin@bharat.artha.ai", pass: "bharat1234" },
                            { icon: "🛒", name: "Flipkart", email: "admin@flipkart.artha.ai", pass: "flipkart1234" },
                            { icon: "🏗️", name: "Lodha Developers", email: "admin@lodha.artha.ai", pass: "lodha1234" },
                            { icon: "📱", name: "Razorpay", email: "admin@razorpay.artha.ai", pass: "razorpay1234" },
                            { icon: "🎓", name: "IIT Bombay", email: "admin@iit.artha.ai", pass: "iit1234" },
                            { icon: "🏫", name: "BITS Pilani", email: "admin@bits.artha.ai", pass: "bits1234" },
                            { icon: "📚", name: "Delhi Public School", email: "admin@delhi.artha.ai", pass: "delhi1234" },
                            { icon: "🤲", name: "Tata Trusts", email: "admin@tata.artha.ai", pass: "tata1234" },
                            { icon: "🤝", name: "Khaitan & Co LLP", email: "admin@khaitan.artha.ai", pass: "khaitan1234" },
                            { icon: "🏛️", name: "Ministry of Finance", email: "admin@ministry.artha.ai", pass: "ministry1234" },
                            { icon: "🏭", name: "Artha Tech (MSME)", email: "admin@artha.artha.ai", pass: "artha1234" },
                          ].map((cred) => (
                            <div
                              key={cred.email}
                              className="flex justify-between items-center p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/5 group"
                              onClick={() => { setEmail(cred.email); setPassword(cred.pass); setError(""); }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base shrink-0">{cred.icon}</span>
                                <div className="min-w-0">
                                  <span className="text-xs font-medium text-stone-400 group-hover:text-white transition-colors block truncate">{cred.email}</span>
                                  <span className="text-[9px] text-stone-500">{cred.name}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-geist-pixel text-stone-500 bg-black px-1.5 py-0.5 rounded border border-white/10 group-hover:border-white/20 transition-colors shrink-0">{cred.pass}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-stone-600 mt-2 ml-1">Each institution sees only its own data — full isolation.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
