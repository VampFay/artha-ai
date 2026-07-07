"use client";
import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import { Menu, X, LogOut, Command, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewState } from "@/lib/types";
import CommandPaletteNew from "@/components/CommandPaletteNew";
import OnboardingFlowNew from "@/components/OnboardingFlowNew";
import DashboardView from "@/views/DashboardView";
import PortfolioView from "@/views/PortfolioView";
import CashflowView from "@/views/CashflowView";
import LiabilitiesView from "@/views/LiabilitiesView";
import RetirementView from "@/views/RetirementView";
import DocumentsView from "@/views/DocumentsView";
import DocumentVerifyView from "@/views/DocumentVerifyView";
import EstateView from "@/views/EstateView";
import TaxView from "@/views/TaxView";
import FinanceView from "@/views/FinanceView";
import GoalsView from "@/views/GoalsView";
import AssistantView from "@/views/AssistantView";
import ReportsView from "@/views/ReportsView";
import SettingsView from "@/views/SettingsView";

const NAV_CATEGORIES = [
  { num: "01", category: "OVERVIEW", items: [{ id: "dashboard", label: "Dashboard" }] },
  { num: "02", category: "ASSETS & PORTFOLIO", items: [{ id: "portfolio", label: "Portfolio Analytics" }] },
  { num: "03", category: "CASH & LIQUIDITY", items: [{ id: "cashflow", label: "Cashflow & Runway" }, { id: "liabilities", label: "Debt Management" }] },
  { num: "04", category: "STRATEGY & PLANNING", items: [{ id: "goals", label: "Goal Simulations" }, { id: "retirement", label: "Retirement & FIRE" }] },
  { num: "05", category: "TAX & METRICS", items: [{ id: "finance", label: "Financial Health" }, { id: "tax", label: "Tax Readiness" }, { id: "reports", label: "Reports & Audits" }] },
  { num: "06", category: "VAULT & LEGAL", items: [{ id: "documents", label: "Document Vault" }, { id: "estate", label: "Estate Planning" }] },
  { num: "07", category: "ORACLE", items: [{ id: "assistant", label: "AI Assistant" }] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { page, navigate } = useNav();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState([
    { label: "HEALTH SCORE", value: "—", up: true },
    { label: "INCOME", value: "—", up: true },
    { label: "SAVINGS RATE", value: "—", up: false },
    { label: "TAX SAVED", value: "—", up: true },
    { label: "TAX SCORE", value: "—", up: true },
  ]);

  // Fetch live ticker data
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("finsight_token");
    if (!token) return;
    Promise.all([
      fetch("/api/tax/summary", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
      fetch("/api/finance/summary?emergency_fund=300000", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
    ]).then(([tax, fin]) => {
      const items: { label: string; value: string; up: boolean }[] = [];
      if (fin?.score != null) items.push({ label: "HEALTH SCORE", value: `${fin.score}/100`, up: true });
      if (fin?.monthly_income != null) items.push({ label: "INCOME", value: `₹${fin.monthly_income.toLocaleString("en-IN")}`, up: fin.monthly_income > 0 });
      if (fin?.metrics?.savings_rate_pct != null) items.push({ label: "SAVINGS RATE", value: `${fin.metrics.savings_rate_pct.toFixed(1)}%`, up: fin.metrics.savings_rate_pct > 0 });
      if (tax?.regime_comparison?.savings_amount != null) items.push({ label: "TAX SAVED", value: `₹${tax.regime_comparison.savings_amount.toLocaleString("en-IN")}`, up: tax.regime_comparison.savings_amount > 0 });
      if (tax?.score?.score != null) items.push({ label: "TAX SCORE", value: `${tax.score.score}/100`, up: true });
      if (items.length > 0) setTickerItems(items);
    });
  }, [user, page]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [page]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Loader2 className="h-6 w-6 animate-spin text-saffron" />
    </div>
  );
  if (!user) return <>{children}</>;

  const handleNav = (view: ViewState) => {
    navigate(view as any);
    setMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (page) {
      case "dashboard": return <DashboardView onNavigate={navigate as any} />;
      case "portfolio": return <PortfolioView />;
      case "cashflow": return <CashflowView />;
      case "liabilities": return <LiabilitiesView />;
      case "retirement": return <RetirementView />;
      case "documents": return <DocumentsView onNavigate={navigate as any} />;
      case "document-verify": return <DocumentVerifyView />;
      case "estate": return <EstateView />;
      case "tax": return <TaxView />;
      case "finance": return <FinanceView />;
      case "goals": return <GoalsView />;
      case "reports": return <ReportsView />;
      case "assistant": return <AssistantView />;
      case "settings": return <SettingsView user={user as any} onLogout={logout} />;
      default: return <DashboardView onNavigate={navigate as any} />;
    }
  };

  const TICKER_ITEMS = tickerItems;

  return (
    <div className="bg-canvas text-carbon font-sans flex w-full relative">
      <CommandPaletteNew isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={handleNav} />
      <OnboardingFlowNew user={user as any} onComplete={() => {}} />

      {/* Desktop Sidebar (Dark) */}
      <aside className="hidden lg:flex w-[260px] flex-col bg-[#111111] text-stone-light relative z-20 shrink-0" style={{ position: "sticky", top: 0, height: "100vh", alignSelf: "flex-start" }}>
        <div className="pt-12 pb-10 px-8 cursor-pointer" onClick={() => handleNav("dashboard")}>
          <h1 className="font-display text-2xl tracking-widest text-saffron mb-1">ARTHA AI</h1>
          <p className="text-[9px] font-bold tracking-[0.2em] text-stone uppercase">Wealth Intelligence</p>
        </div>

        <nav className="flex-1 px-8 py-4 space-y-10 overflow-y-auto">
          {NAV_CATEGORIES.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-saffron tracking-wider">{cat.num}</span>
                <span className="text-[9px] font-bold tracking-[0.1em] text-stone uppercase">— {cat.category}</span>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => {
                  const isActive = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id as ViewState)}
                      className={cn(
                        "w-full text-left py-1 transition-all text-[15px]",
                        isActive ? "text-white font-medium" : "text-stone hover:text-stone-light"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-8 mt-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNav("settings")}>
            <div className="w-8 h-8 rounded-md bg-saffron text-white flex items-center justify-center font-bold text-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-[10px] text-stone uppercase tracking-wider truncate">{user.role === "admin" ? "Admin Tier" : "Premium Tier"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-canvas/90 border-b border-carbon/5 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-2" onClick={() => handleNav("dashboard")}>
          <span className="font-display text-xl tracking-widest text-saffron">ARTHA AI</span>
        </div>
        <button aria-label="Open menu" onClick={() => setMobileMenuOpen(true)} className="p-2 -mr-2 rounded-lg text-carbon hover:bg-carbon/5 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-carbon/20 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-[#111111] text-stone-light z-50 p-8 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <span className="font-display text-2xl tracking-widest text-saffron">ARTHA AI</span>
                <button aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 rounded-lg text-stone hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-10">
                {NAV_CATEGORIES.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-saffron tracking-wider">{cat.num}</span>
                      <span className="text-[9px] font-bold tracking-[0.1em] text-stone uppercase">— {cat.category}</span>
                    </div>
                    <div className="space-y-3">
                      {cat.items.map((item) => {
                        const isActive = page === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNav(item.id as ViewState)}
                            className={cn(
                              "w-full text-left py-1 transition-all text-lg",
                              isActive ? "text-white font-medium" : "text-stone hover:text-stone-light"
                            )}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
              <div className="mt-12 pt-8 border-t border-white/10">
                <button
                  onClick={async () => { await logout(); navigate("dashboard"); }}
                  className="w-full flex items-center gap-3 text-base font-medium text-red-500 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" /><span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content — no forced height, content determines page height */}
      <main className="flex-1 relative pt-16 lg:pt-0 pb-16 bg-canvas flex flex-col" style={{ minHeight: 0 }}>
        {/* Desktop Header */}
        <div className="hidden lg:flex shrink-0 top-0 z-10 h-20 items-center justify-between px-12 max-w-[1200px] mx-auto w-full">
          <div className="text-[10px] font-bold text-carbon uppercase tracking-[0.2em]">Assessment Period: FY 2024-25</div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />AI Model Online
            </div>
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-carbon text-white rounded-full hover:bg-carbon/90 transition-colors"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold tracking-widest uppercase">Command</span>
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Fixed Footer Ticker Bar — compact */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 z-40 bg-canvas/95 pt-3 pb-3 px-6 lg:px-12 pointer-events-none" style={{ backdropFilter: "blur(8px)" }}>
        <div className="flex items-center justify-between mb-2 w-full max-w-[1200px] mx-auto">
          <div />
          <div className="text-[9px] font-bold text-carbon/40 uppercase tracking-[0.1em] flex items-center gap-1.5 pointer-events-auto">
            <Command className="w-2.5 h-2.5" /> <span className="font-pixel bg-carbon/5 px-1 rounded text-carbon">⌘K</span> command palette
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-10 shadow-sm border border-carbon/5 overflow-hidden flex items-center relative pointer-events-auto">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex items-center whitespace-nowrap min-w-max"
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center text-xs px-6 border-r border-carbon/5 last:border-0">
                <span className="font-bold text-stone tracking-[0.15em] uppercase mr-3">{item.label}</span>
                {item.up ? (
                  <ArrowUp className="w-3.5 h-3.5 text-stone-dark mr-1" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-red-500 mr-1" />
                )}
                <span className="font-pixel font-medium text-carbon">{item.value}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
