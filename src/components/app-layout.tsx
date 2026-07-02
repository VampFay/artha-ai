"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LayoutDashboard, FileText, Calculator, TrendingUp, Target, MessageSquare, Download, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/tax", label: "Tax Readiness", icon: Calculator },
  { href: "/finance", label: "Financial Health", icon: TrendingUp },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/assistant", label: "Assistant", icon: MessageSquare },
  { href: "/reports", label: "Reports", icon: Download },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 fixed inset-y-0 left-0 z-40 glass flex-col">
        <div className="p-5 border-b border-slate-200/60">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <span className="text-white font-bold text-base">F</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">FinSight AI</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Financial Assistant</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  active
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200/60">
          <div className="flex items-center gap-2.5 mb-2.5 px-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600">
              {user?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
            {user?.role === "admin" && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Admin</span>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg w-full transition-colors duration-200">
            <LogOut className="h-3.5 w-3.5" />Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav — scrollable to show all items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200/60 flex overflow-x-auto py-2 z-50 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center text-[10px] px-3 whitespace-nowrap transition-colors ${active ? "text-emerald-600" : "text-slate-400"}`}>
              <Icon className="h-5 w-5 mb-0.5" />{item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      {/* Main */}
      <main className="flex-1 md:ml-60 p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto w-full animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
