/**
 * SWR Hooks for Entity Portal
 * ---------------------------
 * Provides cached, auto-refreshing data fetching for all entity views.
 * Reduces redundant API calls and improves perceived performance.
 */

import useSWR from "swr";
import { entities as entitiesApi } from "./api";

// ============================================================
// Entity list + details
// ============================================================

export function useEntities() {
  const { data, error, isLoading, mutate } = useSWR("/api/entities", () => entitiesApi.list());
  return { entities: data?.data || [], error, isLoading, mutate };
}

export function useEntity(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}` : null,
    () => id ? entitiesApi.get(id) : null
  );
  return { entity: data?.data || null, error, isLoading, mutate };
}

// ============================================================
// Entity tax summary
// ============================================================

export function useEntityTaxSummary(id: string | null, fy: string = "2024-25") {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/tax-summary?fy=${fy}` : null,
    () => id ? entitiesApi.taxSummary.get(id, fy) : null
  );
  return { taxSummary: data?.data || null, error, isLoading, mutate };
}

// ============================================================
// Entity compliance calendar
// ============================================================

export function useEntityCompliance(id: string | null, months: number = 12) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/compliance-calendar?months=${months}` : null,
    () => id ? entitiesApi.complianceCalendar(id, months) : null
  );
  return {
    calendar: data?.data?.calendar || [],
    upcoming: data?.data?.upcoming || [],
    overdue: data?.data?.overdue || [],
    summary: data?.data?.summary || { totalUpcoming: 0, totalOverdue: 0, criticalDue: 0 },
    error,
    isLoading,
    mutate,
  };
}

// ============================================================
// Entity team
// ============================================================

export function useEntityTeam(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/team` : null,
    () => id ? entitiesApi.team(id) : null
  );
  return { members: data?.data || [], error, isLoading, mutate };
}

// ============================================================
// Entity notices
// ============================================================

export function useEntityNotices(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/notices` : null,
    () => id ? entitiesApi.notices(id) : null
  );
  return { notices: data?.data || [], error, isLoading, mutate };
}

// ============================================================
// Entity transactions
// ============================================================

export function useEntityTransactions(id: string | null, limit: number = 100) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/transactions?limit=${limit}` : null,
    () => id ? entitiesApi.transactions(id) : null
  );
  return { transactions: data?.data || [], error, isLoading, mutate };
}

// ============================================================
// Entity filings
// ============================================================

export function useEntityFilings(id: string | null, status?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/entities/${id}/filings${status ? `?status=${status}` : ""}` : null,
    () => id ? entitiesApi.filings.list(id) : null
  );
  return { filings: data?.data || [], error, isLoading, mutate };
}

// ============================================================
// Entity alerts (proactive AI)
// ============================================================

export function useEntityAlerts(id: string | null) {
  const { data, error, isLoading } = useSWR(
    id ? `/api/entities/${id}/alerts` : null,
    async () => {
      if (!id) return null;
      const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;
      const res = await fetch(`/api/entities/${id}/alerts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return res.json();
    },
    { refreshInterval: 60000 } // Refresh every 60s
  );
  return { alerts: data?.data || [], error, isLoading };
}

// ============================================================
// Entity types (for onboarding)
// ============================================================

export function useEntityTypes() {
  const { data, error, isLoading } = useSWR("/api/entities/types", () => entitiesApi.types());
  return { types: data?.data || null, error, isLoading };
}
