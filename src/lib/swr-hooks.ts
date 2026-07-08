"use client";
import useSWR from "swr";

const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;
  if (!token) throw new Error("No token");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(data.detail || `Error ${res.status}`);
  }
  return res.json();
};

export function useTaxSummary() {
  return useSWR("/api/tax/summary", fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
}

export function useFinanceSummary(emergencyFund: number = 300000) {
  return useSWR(`/api/finance/summary?emergency_fund=${emergencyFund}`, fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
}

export function usePortfolio() {
  return useSWR("/api/portfolio/summary", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useCashflowSummary() {
  return useSWR("/api/cashflow/summary", fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
}

export function useIncomeVsExpenses(months: number = 6) {
  return useSWR(`/api/cashflow/income-vs-expenses?months=${months}`, fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
}

export function useTopExpenses() {
  return useSWR("/api/cashflow/expenses", fetcher, { revalidateOnFocus: false, dedupingInterval: 10000 });
}

export function useLiabilities() {
  return useSWR("/api/liabilities", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useEstate() {
  return useSWR("/api/estate/nominees", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useSubscriptions() {
  return useSWR("/api/subscriptions", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useGoals() {
  return useSWR("/api/goals", fetcher, { revalidateOnFocus: false, dedupingInterval: 5000 });
}

export function useDocuments() {
  return useSWR("/api/documents", fetcher, { revalidateOnFocus: false, dedupingInterval: 5000 });
}

export function useOracleInsight() {
  return useSWR("/api/oracle/insight", fetcher, { revalidateOnFocus: false, dedupingInterval: 60000 });
}

export function useExtractionFields(docId: string | null) {
  return useSWR(docId ? `/api/extraction/${docId}/fields` : null, fetcher, { revalidateOnFocus: false, dedupingInterval: 5000 });
}

export function useConsentHistory() {
  return useSWR("/api/consent/history", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useAuditLog() {
  return useSWR("/api/audit-log", fetcher, { revalidateOnFocus: false, dedupingInterval: 30000 });
}

export function useTickerData() {
  return useSWR("/api/tax/summary", fetcher, { revalidateOnFocus: false, dedupingInterval: 300000 }); // 5 min cache
}
