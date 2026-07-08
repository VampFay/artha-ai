"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { auth, setToken, User } from "./api";

interface AuthState {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Returns true on success, false on failure.
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("finsight_refresh_token") : null;
    if (!refresh) return false;

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        localStorage.removeItem("finsight_refresh_token");
        return false;
      }
      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem("finsight_refresh_token", data.refresh_token);
      return true;
    } catch {
      localStorage.removeItem("finsight_refresh_token");
      return false;
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    auth.me()
      .then((u) => setUser(u))
      .catch(async () => {
        // Access token might be expired — try refresh
        const refreshed = await refreshToken();
        if (refreshed) {
          try {
            const u = await auth.me();
            setUser(u);
          } catch {
            setToken(null);
            localStorage.removeItem("finsight_refresh_token");
          }
        } else {
          setToken(null);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshToken]);

  const login = async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    setToken(res.access_token);
    // Store refresh token if returned
    if (res.refresh_token) {
      localStorage.setItem("finsight_refresh_token", res.refresh_token);
    }
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await auth.register({ name, email, password });
    setToken(res.access_token);
    if (res.refresh_token) {
      localStorage.setItem("finsight_refresh_token", res.refresh_token);
    }
    setUser(res.user);
  };

  const logout = async () => {
    try { await auth.logout(); } catch {}
    setToken(null);
    localStorage.removeItem("finsight_refresh_token");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
