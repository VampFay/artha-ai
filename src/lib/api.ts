// API client — uses relative /api paths (required by Z.ai gateway).
// Auto-attaches JWT from localStorage.

export interface ApiError { detail: string; status: number }

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("finsight_token");
}
export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("finsight_token", token);
  else localStorage.removeItem("finsight_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    let res = await fetch(path, { ...options, headers });

    // On 401, try refresh token once before giving up
    if (res.status === 401) {
      const refresh = typeof window !== "undefined" ? localStorage.getItem("finsight_refresh_token") : null;
      if (refresh) {
        try {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
          });
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            setToken(data.access_token);
            localStorage.setItem("finsight_refresh_token", data.refresh_token);
            // Retry original request with new token
            headers["Authorization"] = `Bearer ${data.access_token}`;
            res = await fetch(path, { ...options, headers });
          } else {
            localStorage.removeItem("finsight_refresh_token");
            setToken(null);
            throw { detail: "Session expired", status: 401 } as ApiError;
          }
        } catch {
          localStorage.removeItem("finsight_refresh_token");
          setToken(null);
          throw { detail: "Session expired", status: 401 } as ApiError;
        }
      } else {
        setToken(null);
        throw { detail: "Session expired", status: 401 } as ApiError;
      }
    }

    if (!res.ok) {
      let detail = "Request failed";
      try { const err = await res.json(); detail = err.detail || detail; } catch {}
      throw { detail, status: res.status } as ApiError;
    }
    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (e: any) {
    if (e?.detail) throw e;
    throw { detail: "Network error", status: 0 } as ApiError;
  }
}

// Auth
export const auth = {
  register: (d: { name: string; email: string; password: string }) => apiFetch<{ access_token: string; refresh_token?: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(d) }),
  login: (d: { email: string; password: string }) => apiFetch<{ access_token: string; refresh_token?: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(d) }),
  logout: () => apiFetch<{ message: string }>("/api/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/api/users/me"),
};

// Consent
export const consent = {
  getCurrentText: () => apiFetch<{ consent_type: string; consent_text: string }>("/api/consent"),
  accept: (d: { consent_type: string; consent_text: string }) => apiFetch<{ id: string }>("/api/consent", { method: "POST", body: JSON.stringify(d) }),
  history: () => apiFetch<{ items: Consent[]; total: number }>("/api/consent/history"),
};

// Tax + Finance
export const tax = { summary: (fy = "2024-25") => apiFetch<TaxSummary>(`/api/tax/summary?financial_year=${fy}`) };
export const finance = { summary: (ef = 0) => apiFetch<FinanceSummary>(`/api/finance/summary?emergency_fund=${ef}`) };

// Goals
export const goals = {
  list: () => apiFetch<{ items: Goal[]; total: number }>("/api/goals"),
  create: (d: any) => apiFetch<Goal>("/api/goals", { method: "POST", body: JSON.stringify(d) }),
  delete: (id: string) => apiFetch<void>(`/api/goals/${id}`, { method: "DELETE" }),
};

// Audit + Export
export const audit = { list: () => apiFetch<{ items: AuditLogEntry[]; total: number }>("/api/audit-log") };
export const userData = { exportUrl: () => `/api/users/me/export` };

// Types
export interface User { id: string; name: string; email: string; role: string; created_at: string }
export interface Consent { id: string; consent_type: string; consent_text: string; accepted_at: string; revoked_at: string | null }
export interface TaxSummary {
  financial_year: string; score: { score: number; breakdown: Record<string, number> };
  income_summary: Record<string, number>; deduction_summary: Record<string, number>;
  regime_comparison: { old_regime: Record<string, number>; new_regime: Record<string, number>; recommended_regime: string; savings_amount: number };
  missing_documents: { doc_type: string; reason: string; severity: string }[];
  mismatches: any[]; fields_verified_pct: number; computed_at: string;
}
export interface FinanceSummary {
  month: string; score: number; score_breakdown: Record<string, number>;
  metrics: { savings_rate_pct: number; debt_to_income_pct: number; emergency_fund_months: number; subscription_total: number; subscription_pct_of_income: number };
  monthly_income: number; monthly_expenses: number;
  top_categories: { category: string; amount: number; percentage: number }[];
  suggestions: string[];
}
export interface Goal { id: string; goal_name: string; target_amount: number; current_amount: number; monthly_contribution: number; target_date: string | null; expected_return_rate: number; projection: any | null }
export interface AuditLogEntry { id: string; action: string; details: any; ip_address: string | null; timestamp: string }
