"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PortalMode = "individual" | "entities";

interface PortalState {
  mode: PortalMode;
  activeEntityId: string | null;
  setMode: (mode: PortalMode) => void;
  setActiveEntityId: (id: string | null) => void;
  hydrated: boolean;
}

const PortalContext = createContext<PortalState | undefined>(undefined);

const STORAGE_KEY_MODE = "artha_portal_mode";
const STORAGE_KEY_ENTITY = "artha_active_entity";

export function PortalProvider({ children }: { children: ReactNode }) {
  // Always start with "individual" on both server and client to prevent
  // hydration mismatches. Load from localStorage AFTER hydration completes.
  const [mode, setModeState] = useState<PortalMode>("individual");
  const [activeEntityId, setActiveEntityIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (AFTER hydration — runs only on client)
  useEffect(() => {
    try {
      const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as PortalMode | null;
      const storedEntity = localStorage.getItem(STORAGE_KEY_ENTITY);
      if (storedMode === "individual" || storedMode === "entities") {
        setModeState(storedMode);
      }
      if (storedEntity) {
        setActiveEntityIdState(storedEntity);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const setMode = (newMode: PortalMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, newMode);
    } catch {}
  };

  const setActiveEntityId = (id: string | null) => {
    setActiveEntityIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY_ENTITY, id);
      else localStorage.removeItem(STORAGE_KEY_ENTITY);
    } catch {}
  };

  return (
    <PortalContext.Provider value={{ mode, activeEntityId, setMode, setActiveEntityId, hydrated }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
