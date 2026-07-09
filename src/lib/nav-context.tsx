"use client";
import { createContext, useContext, useState, ReactNode } from "react";

// Entity-specific page names (in addition to individual ones)
type EntityPageName =
  | "entity-dashboard"
  | "entity-tax"
  | "entity-compliance"
  | "entity-documents"
  | "entity-team"
  | "entity-notices"
  | "entity-onboarding"
  | "entity-switcher";

type PageName =
  | "dashboard"
  | "portfolio"
  | "cashflow"
  | "liabilities"
  | "retirement"
  | "documents"
  | "estate"
  | "tax"
  | "finance"
  | "goals"
  | "assistant"
  | "reports"
  | "settings"
  | "document-verify"
  | EntityPageName;

interface NavState {
  page: PageName;
  params: Record<string, string>;
  navigate: (page: PageName, params?: Record<string, string>) => void;
}

const NavContext = createContext<NavState | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageName>("dashboard");
  const [params, setParams] = useState<Record<string, string>>({});

  const navigate = (newPage: PageName, newParams?: Record<string, string>) => {
    setPage(newPage);
    setParams(newParams || {});
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  return <NavContext.Provider value={{ page, params, navigate }}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}

export type { PageName, EntityPageName };
