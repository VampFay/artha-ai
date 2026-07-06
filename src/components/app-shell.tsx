"use client";
import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNav } from "@/lib/nav-context";
import { LayoutDashboard, FileText, Calculator, TrendingUp, Target, MessageSquare, Download, Settings, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";

const navItems = [
  { page: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { page: "documents" as const, label: "Documents", icon: FileText },
  { page: "tax" as const, label: "Tax Readiness", icon: Calculator },
  { page: "finance" as const, label: "Financial Health", icon: TrendingUp },
  { page: "goals" as const, label: "Goals", icon: Target },
  { page: "assistant" as const, label: "Assistant", icon: MessageSquare },
  { page: "reports" as const, label: "Reports", icon: Download },
  { page: "settings" as const, label: "Settings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, loading } = useAuth();
  const { page, navigate } = useNav();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-forest)" }} /></div>;
  }
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-cream)" }}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 fixed inset-y-0 left-0 z-40 flex-col border-r" style={{ borderColor: "var(--color-line)", background: "var(--color-surface-warm)" }}>
        <div className="px-5 py-6">
          <button onClick={() => navigate("dashboard")} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-forest)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-cream)" }}>F</span>
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none" style={{ color: "var(--color-ink)" }}>FinSight AI</h1>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--color-ink-muted)" }}>Financial Assistant</p>
            </div>
          </button>
        </div>
        <div className="px-2 mb-1"><div className="divider-soft" /></div>
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.page;
            return (
              <button key={item.page} onClick={() => navigate(item.page)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={active
                  ? { background: "rgba(13, 59, 46, 0.06)", color: "var(--color-forest)" }
                  : { color: "var(--color-ink-soft)" }
                }
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(13, 59, 46, 0.03)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon className="h-[18px] w-[18px]" style={active ? { color: "var(--color-forest)" } : {}} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-2 py-2"><div className="divider-soft" /></div>
        <div className="px-3 py-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "var(--color-forest)", color: "var(--color-cream)" }}>
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--color-ink)" }}>{user?.name}</p>
              <p className="text-[10px] truncate" style={{ color: "var(--color-ink-muted)" }}>{user?.email}</p>
            </div>
            {user?.role === "admin" && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(212, 160, 23, 0.12)", color: "var(--color-gold)" }}>Admin</span>}
          </div>
          <button onClick={async () => { await logout(); navigate("dashboard"); }}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full transition-colors"
            style={{ color: "var(--color-ink-muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-clay)"; e.currentTarget.style.background = "rgba(198, 93, 58, 0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-ink-muted)"; e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut className="h-3.5 w-3.5" />Logout
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex overflow-x-auto py-2 z-50 border-t" style={{ borderColor: "var(--color-line)", background: "var(--color-surface-warm)" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.page;
          return (
            <button key={item.page} onClick={() => navigate(item.page)} className="flex flex-col items-center text-[10px] px-3 whitespace-nowrap transition-colors"
              style={{ color: active ? "var(--color-forest)" : "var(--color-ink-muted)" }}>
              <Icon className="h-5 w-5 mb-0.5" />{item.label.split(" ")[0]}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 md:ml-56 p-4 md:p-10 pb-20 md:pb-10">
        <div className="max-w-5xl mx-auto w-full animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
