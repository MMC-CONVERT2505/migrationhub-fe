import type { Pair, Plan } from '@/types';

/** The countries the price list is sold in; the label is what the customer sees, the name keys the price list. */
export const PRICED_COUNTRIES = [
  'Australia', 'New Zealand', 'United Kingdom', 'United States', 'Canada',
  'Singapore', 'India', 'United Arab Emirates', 'South Africa',
] as const;

/** "Australia (AUD)" (the form label) or "australia" → "Australia"; null when it is not a country we sell in. */
export function normalizeCountry(raw: string | null | undefined): string | null {
  const name = (raw ?? '').replace(/\s*\([A-Za-z]{3}\)\s*$/, '').trim().toLowerCase();
  return PRICED_COUNTRIES.find((c) => c.toLowerCase() === name) ?? null;
}

export const hasPriceList = (pair: Pair | null | undefined): boolean => (pair?.planPrices?.length ?? 0) > 0;

/** Where the pair is free (some plan costs nothing) and where it is paid, from the price list. */
export function pricingRegions(pair: Pair | null | undefined): { free: string[]; paid: string[] } {
  const countries = offeredCountries(pair);
  const free = countries.filter((c) => (pair?.planPrices ?? []).some((r) => r.country === c && r.basePrice === 0));
  return { free, paid: countries.filter((c) => !free.includes(c)) };
}

/** Countries this pair is sold in, in the price list's canonical order. */
export function offeredCountries(pair: Pair | null | undefined): string[] {
  if (!pair) return [];
  const have = new Set((pair.planPrices ?? []).map((r) => r.country));
  return PRICED_COUNTRIES.filter((c) => have.has(c));
}

/** Countries any of these pairs is priced for, in the price list's canonical order. */
export function countriesOf(pairs: readonly Pair[]): string[] {
  const have = new Set(pairs.flatMap((p) => offeredCountries(p)));
  return PRICED_COUNTRIES.filter((c) => have.has(c));
}

/** The country to use: the chosen one if this pair sells there, else null (never a silent substitute). */
export const validCountry = (pair: Pair | null | undefined, country: string | null | undefined): string | null => {
  const c = normalizeCountry(country);
  return c && offeredCountries(pair).includes(c) ? c : null;
};

/**
 * The pair's plans as priced for a country: price, extra-year price, currency and tax come from the
 * price list, and plans with no row there are dropped. A pair without a price list is unchanged.
 */
export function pricedPlans(pair: Pair | null | undefined, country: string | null | undefined): Plan[] {
  if (!pair) return [];
  if (!hasPriceList(pair)) return pair.plans;
  const c = validCountry(pair, country);
  if (!c) return [];
  return pair.plans.flatMap((plan) => {
    const row = pair.planPrices?.find((r) => r.planId === plan.id && r.country === c);
    return row
      ? [{ ...plan, basePrice: row.basePrice, // The plan's own extra-year price is the admin's on/off switch (empty = Disabled); the row only sets the amount.
        extraYearPrice: plan.extraYearPrice == null ? null : row.extraYearPrice, currency: row.currency, taxRate: row.taxRate }]
      : [];
  });
}

export interface Totals {
  /** Price before tax: plan plus any extra years. */
  subtotal: number;
  tax: number;
  /** What is charged. */
  total: number;
}

/** Subtotal, tax and total in whole cents arithmetic, mirroring the server (tax rounded half-up). */
export function orderTotals(plan: Pick<Plan, 'basePrice' | 'taxRate'> | null | undefined, extension: number): Totals {
  if (!plan) return { subtotal: 0, tax: 0, total: 0 };
  const net = Math.round(Number(plan.basePrice) * 100) + Math.round(extension * 100);
  const tax = Math.round((net * Number(plan.taxRate ?? 0)) / 100);
  return { subtotal: net / 100, tax: tax / 100, total: (net + tax) / 100 };
}
