"use client";
import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import { GradientMesh } from "@/components/motion/gradient-mesh";
import { PageTransition } from "@/components/motion/page-transition";
import { CursorSpotlight } from "@/components/motion/cursor-spotlight";
import { LayoutDashboard, FileText, Calculator, TrendingUp, Target, MessageSquare, Download, Settings, LogOut, Loader2 } from "lucide-react";

const navItems = [
  { page: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { page: "documents" as const, label: "Documents", icon: FileText },
  { page: "tax" as const, label: "Tax", icon: Calculator },
  { page: "finance" as const, label: "Finance", icon: TrendingUp },
  { page: "goals" as const, label: "Goals", icon: Target },
  { page: "assistant" as const, label: "AI Assistant", icon: MessageSquare },
  { page: "reports" as const, label: "Reports", icon: Download },
  { page: "settings" as const, label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { page, navigate } = useNav();
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // close mobile menu on page change
  useEffect(() => { setMobileOpen(false); }, [page]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center relative">
      <GradientMesh />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
            <span className="text-xl font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
          </div>
          <motion.div
            className="absolute -inset-1 rounded-2xl"
            style={{ background: "radial-gradient(circle, rgba(212,160,23,0.4) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-forest)" }} />
      </motion.div>
    </div>
  );
  if (!user) return <>{children}</>;

  const activeIndex = navItems.findIndex(n => n.page === page);
  const indicatorPage = hovered || page;
  const indicatorIndex = navItems.findIndex(n => n.page === indicatorPage);

  return (
    <div className="min-h-screen relative">
      <GradientMesh />

      <div className="relative z-10 min-h-screen flex">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-56 fixed inset-y-0 left-0 z-40 flex-col p-4">
          <CursorSpotlight className="flex-1 rounded-3xl flex flex-col h-full" radius={220} color="rgba(212,160,23,0.08)">
          <div
            className="flex-1 rounded-3xl flex flex-col h-full"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(253,252,250,0.75) 100%)",
              backdropFilter: "blur(24px) saturate(140%)",
              WebkitBackdropFilter: "blur(24px) saturate(140%)",
              border: "1px solid rgba(232,226,214,0.7)",
              boxShadow: "0 24px 56px -20px rgba(13,59,46,0.18), 0 2px 4px -1px rgba(13,59,46,0.04)",
            }}
          >
            {/* Logo */}
            <button onClick={() => navigate("dashboard")} className="px-5 pt-5 pb-4 group flex items-center gap-3">
              <div className="relative">
                <motion.div
                  className="h-10 w-10 rounded-xl flex items-center justify-center relative"
                  style={{ background: "linear-gradient(135deg, #0d3b2e 0%, #062418 100%)", boxShadow: "0 4px 12px -2px rgba(13,59,46,0.4)" }}
                  whileHover={{ scale: 1.05, rotate: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-base font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
                </motion.div>
                <motion.div
                  className="absolute -inset-0.5 rounded-xl pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)" }}
                  animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="text-left">
                <h1 className="text-sm font-bold leading-none" style={{ color: "var(--color-forest)" }}>FinSight</h1>
                <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--color-ink-muted)" }}>AI Assistant</p>
              </div>
            </button>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-2 space-y-1 relative">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.page;
                return (
                  <button
                    key={item.page}
                    onClick={() => navigate(item.page)}
                    onMouseEnter={() => setHovered(item.page)}
                    onMouseLeave={() => setHovered(null)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium relative transition-colors duration-200"
                    style={{ color: active ? "var(--color-cream)" : "var(--color-ink-soft)" }}
                  >
                    {/* sliding active indicator */}
                    {indicatorPage === item.page && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: active
                            ? "linear-gradient(135deg, #0d3b2e 0%, #062418 100%)"
                            : "rgba(13,59,46,0.06)",
                          boxShadow: active ? "0 4px 12px -3px rgba(13,59,46,0.35)" : "none",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon className="h-[17px] w-[17px] relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User footer */}
            <div className="px-3 pb-3 pt-3 border-t" style={{ borderColor: "var(--color-line-soft)" }}>
              <div className="flex items-center gap-2.5 mb-2 px-1">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #0d3b2e, #1a5c47)", color: "var(--color-gold-light)" }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--color-ink)" }}>{user?.name}</p>
                  <p className="text-[10px] truncate" style={{ color: "var(--color-ink-muted)" }}>{user?.email}</p>
                </div>
                {user?.role === "admin" && (
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(212,160,23,0.18)", color: "var(--color-gold)" }}>Admin</span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={async () => { await logout(); navigate("dashboard"); }}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl w-full transition-colors"
                style={{ color: "var(--color-ink-muted)", background: "transparent" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-clay)"; e.currentTarget.style.background = "rgba(198,93,58,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-ink-muted)"; e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut className="h-3.5 w-3.5" />Logout
              </motion.button>
            </div>
          </div>
          </CursorSpotlight>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between" style={{ background: "rgba(250,247,242,0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid var(--color-line)" }}>
          <button onClick={() => navigate("dashboard")} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0d3b2e, #062418)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-gold-light)" }}>F</span>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--color-forest)" }}>FinSight</span>
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "var(--color-cream-dark)" }}>
            <div className="flex flex-col gap-1">
              <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 4 : 0 }} style={{ display: "block", width: 16, height: 1.5, background: "var(--color-forest)" }} />
              <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} style={{ display: "block", width: 16, height: 1.5, background: "var(--color-forest)" }} />
              <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -4 : 0 }} style={{ display: "block", width: 16, height: 1.5, background: "var(--color-forest)" }} />
            </div>
          </button>
        </div>

        {/* Mobile nav drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40 pt-16"
              style={{ background: "rgba(250,247,242,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
              onClick={() => setMobileOpen(false)}
            >
              <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className="px-5 py-4 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {navItems.map((item, i) => {
                  const Icon = item.icon; const active = page === item.page;
                  return (
                    <motion.button
                      key={item.page}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.05 + i * 0.04 }}
                      onClick={() => navigate(item.page)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                      style={active ? { background: "var(--color-forest)", color: "var(--color-cream)" } : { color: "var(--color-ink-soft)" }}
                    >
                      <Icon className="h-5 w-5" />{item.label}
                    </motion.button>
                  );
                })}
                <motion.button
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + navItems.length * 0.04 }}
                  onClick={async () => { await logout(); navigate("dashboard"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mt-4"
                  style={{ color: "var(--color-clay)", background: "rgba(198,93,58,0.08)" }}
                >
                  <LogOut className="h-5 w-5" />Logout
                </motion.button>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 md:ml-56 pt-16 md:pt-0 pb-24 md:pb-8 px-4 md:px-8 relative">
          <div className="max-w-6xl mx-auto w-full pt-4 md:pt-8">
            <PageTransition pageKey={page}>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
