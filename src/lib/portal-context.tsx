"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type PortalMode = "individual" | "entities";

interface PortalState {
  mode: PortalMode;
  activeEntityId: string | null;
  setMode: (mode: PortalMode) => void;
  setActiveEntityId: (id: string | null) => void;
}

const PortalContext = createContext<PortalState | undefined>(undefined);

const STORAGE_KEY_MODE = "artha_portal_mode";
const STORAGE_KEY_ENTITY = "artha_active_entity";

export function PortalProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PortalMode>("individual");
  const [activeEntityId, setActiveEntityIdState] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedMode = localStorage.getItem(STORAGE_KEY_MODE) as PortalMode | null;
    const storedEntity = localStorage.getItem(STORAGE_KEY_ENTITY);
    if (storedMode === "individual" || storedMode === "entities") {
      setModeState(storedMode);
    }
    if (storedEntity) {
      setActiveEntityIdState(storedEntity);
    }
  }, []);

  const setMode = (newMode: PortalMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_MODE, newMode);
    }
  };

  const setActiveEntityId = (id: string | null) => {
    setActiveEntityIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(STORAGE_KEY_ENTITY, id);
      else localStorage.removeItem(STORAGE_KEY_ENTITY);
    }
  };

  return (
    <PortalContext.Provider value={{ mode, activeEntityId, setMode, setActiveEntityId }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
