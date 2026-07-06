"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNav } from "@/lib/nav-context";
import { useAuth } from "@/lib/auth-context";
import {
  Search, LayoutDashboard, FileText, Calculator, TrendingUp,
  Target, MessageSquare, Download, Settings, UploadCloud,
  Sparkles, ArrowRight, CornerDownLeft, Command, type LucideIcon
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: "Navigation" | "Quick Actions" | "Documents";
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { navigate } = useNav();
  const { logout } = useAuth();

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery("");
        setActiveIndex(0);
      }, 50);
    }
  }, [open]);

  const go = (page: string, params?: any) => {
    navigate(page as any, params);
    setOpen(false);
  };

  const items: CommandItem[] = useMemo(() => [
    { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Navigation", action: () => go("dashboard"), keywords: ["home", "overview"] },
    { id: "nav-documents", label: "Documents", icon: FileText, group: "Navigation", action: () => go("documents"), keywords: ["upload", "files", "pdf"] },
    { id: "nav-tax", label: "Tax Readiness", icon: Calculator, group: "Navigation", action: () => go("tax"), keywords: ["tax", "score", "regime"] },
    { id: "nav-finance", label: "Financial Health", icon: TrendingUp, group: "Navigation", action: () => go("finance"), keywords: ["finance", "health", "score"] },
    { id: "nav-goals", label: "Goals", icon: Target, group: "Navigation", action: () => go("goals"), keywords: ["goal", "target", "savings"] },
    { id: "nav-assistant", label: "AI Assistant", icon: MessageSquare, group: "Navigation", action: () => go("assistant"), keywords: ["ai", "chat", "ask"] },
    { id: "nav-reports", label: "Reports", icon: Download, group: "Navigation", action: () => go("reports"), keywords: ["report", "pdf", "export"] },
    { id: "nav-settings", label: "Settings", icon: Settings, group: "Navigation", action: () => go("settings"), keywords: ["account", "consent"] },
    { id: "act-upload", label: "Upload Document", icon: UploadCloud, group: "Quick Actions", action: () => go("documents"), keywords: ["upload", "new", "add"] },
    { id: "act-ask", label: "Ask AI Assistant", icon: Sparkles, group: "Quick Actions", action: () => go("assistant"), keywords: ["ai", "question"] },
    { id: "act-report", label: "Generate Tax Report", icon: Download, group: "Quick Actions", action: () => go("reports"), keywords: ["report", "pdf", "tax"] },
  ], []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    );
  }, [query, items]);

  // Group filtered items
  const grouped = useMemo(() => {
    const g: Record<string, CommandItem[]> = {};
    filtered.forEach(item => {
      if (!g[item.group]) g[item.group] = [];
      g[item.group].push(item);
    });
    return g;
  }, [filtered]);

  // Reset active index when query changes
  useEffect(() => { setActiveIndex(0); }, [query]);

  // Keyboard nav
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIndex]?.action();
    }
  };

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
          style={{ background: "rgba(6,36,24,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(253,252,250,0.95) 100%)",
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid rgba(232,226,214,0.8)",
              boxShadow: "0 32px 80px -20px rgba(6,36,24,0.5), 0 4px 12px -2px rgba(13,59,46,0.1)",
            }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--color-line-soft)" }}>
              <Search className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-ink-muted)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, actions, documents..."
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                style={{ color: "var(--color-ink)" }}
                suppressHydrationWarning
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--color-cream-dark)", color: "var(--color-ink-muted)", border: "1px solid var(--color-line)" }}>ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>No results for "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([group, groupItems]) => (
                  <div key={group} className="mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: "var(--color-ink-muted)" }}>{group}</p>
                    {groupItems.map(item => {
                      const Icon = item.icon;
                      const idx = filtered.indexOf(item);
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          data-idx={idx}
                          onClick={item.action}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors relative"
                          style={{
                            background: active ? "linear-gradient(135deg, #0d3b2e, #062418)" : "transparent",
                            color: active ? "var(--color-cream)" : "var(--color-ink-soft)",
                          }}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: active ? "var(--color-gold-light)" : "var(--color-ink-muted)" }} />
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                          {item.hint && <span className="text-[10px] opacity-60">{item.hint}</span>}
                          {active && <CornerDownLeft className="h-3 w-3 opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t text-[10px]" style={{ borderColor: "var(--color-line-soft)", color: "var(--color-ink-muted)" }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded" style={{ background: "var(--color-cream-dark)" }}>↑</kbd><kbd className="font-mono px-1 rounded" style={{ background: "var(--color-cream-dark)" }}>↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="font-mono px-1 rounded" style={{ background: "var(--color-cream-dark)" }}>↵</kbd> select</span>
              </div>
              <span className="flex items-center gap-1"><Command className="h-3 w-3" /> FinSight AI</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
