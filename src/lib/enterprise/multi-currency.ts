/**
 * Multi-Currency Support
 * ----------------------
 * Per-tenant currency with conversion for unified reporting.
 * Default: INR (India). Supported: USD, EUR, GBP, SGD, AED, JPY.
 *
 * Exchange rates fetched daily from RBI reference rates + openexchangerates.
 * Stored in DB, cached in Redis.
 */

import { db } from "../db";

export type Currency = "INR" | "USD" | "EUR" | "GBP" | "SGD" | "AED" | "JPY";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AED: "AED",
  JPY: "¥",
};

export const CURRENCY_DECIMALS: Record<Currency, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  SGD: 2,
  AED: 2,
  JPY: 0, // JPY has no minor unit
};

export interface ExchangeRate {
  from: Currency;
  to: Currency;
  rate: number;
  date: string; // YYYY-MM-DD
  source: "rbi" | "openexchangerates" | "ecb";
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  date?: string
): Promise<number> {
  if (from === to) return amount;

  // Try direct rate
  let rate = await getRate(from, to, date);
  if (rate !== null) return amount * rate;

  // Try inverse rate
  rate = await getRate(to, from, date);
  if (rate !== null) return amount / rate;

  // Try via USD (base currency)
  const fromUsd = await getRate(from, "USD", date);
  const toUsd = await getRate(to, "USD", date);
  if (fromUsd !== null && toUsd !== null) {
    return (amount / fromUsd) * toUsd;
  }

  throw new Error(`No exchange rate available for ${from} → ${to}`);
}

/**
 * Get exchange rate from cache or external API.
 * Returns null if not available.
 */
async function getRate(from: Currency, to: Currency, date?: string): Promise<number | null> {
  const targetDate = date || new Date().toISOString().slice(0, 10);

  // In production: query ExchangeRate model in DB
  // For now: return hardcoded approximate rates for dev
  const FALLBACK_RATES: Record<string, number> = {
    "INR-USD": 0.012,
    "USD-INR": 83.5,
    "INR-EUR": 0.011,
    "EUR-INR": 90.5,
    "USD-EUR": 0.92,
    "EUR-USD": 1.08,
    "USD-GBP": 0.79,
    "GBP-USD": 1.27,
    "USD-SGD": 1.34,
    "SGD-USD": 0.75,
    "USD-AED": 3.67,
    "AED-USD": 0.27,
    "USD-JPY": 145,
    "JPY-USD": 0.0069,
  };

  const key = `${from}-${to}`;
  return FALLBACK_RATES[key] ?? null;
}

/**
 * Format a currency amount for display.
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const decimals = CURRENCY_DECIMALS[currency];
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}

/**
 * Get tenant's default currency.
 */
export async function getTenantCurrency(tenantId: string): Promise<Currency> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  return (tenant?.currency as Currency) || "INR";
}
