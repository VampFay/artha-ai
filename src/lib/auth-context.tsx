"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    // Check for token in localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    // Verify the token by fetching /api/users/me
    auth.me()
      .then((u) => setUser(u))
      .catch(() => {
        // Token is invalid — clear it
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await auth.login({ email, password });
    setToken(res.access_token);
    setUser(res.user);
  };
  const register = async (name: string, email: string, password: string) => {
    const res = await auth.register({ name, email, password });
    setToken(res.access_token);
    setUser(res.user);
  };
  const logout = async () => {
    try { await auth.logout(); } catch {}
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
