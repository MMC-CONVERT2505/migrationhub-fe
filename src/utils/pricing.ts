import type { Pair, Plan } from '@/types';

export interface PlanSummary {
  key: string;
  name: string;
  currency: string;
  min: number;
  max: number;
  /** Lowest price above zero (what a paying customer sees as "from"); 0 when every offer is free. */
  minPaid: number;
  /** Some migration offers this plan for free. */
  hasFree: boolean;
  /** Highest tax % added on top (e.g. India GST 18); 0 = none. */
  taxRate: number;
  pairCount: number;
  history: string;
  support: string;
  features: string[];
  popular: boolean;
}

const ORDER = ['free', 'basic', 'standard', 'enterprise'];
const rank = (name: string) => {
  const i = ORDER.indexOf(name.trim().toLowerCase());
  return i === -1 ? ORDER.length : i;
};

interface Offer {
  plan: Plan;
  price: number;
  currency: string;
  tax: number;
}

/** What each of a pair's plans is sold for: its country price-list rows, or (no list) the plan's own price. */
function offersOf(pair: Pair, country: string | null, defaultCurrency: string): Offer[] {
  const plans = pair.plans ?? ([] as Plan[]);
  if ((pair.planPrices?.length ?? 0) > 0) {
    return plans.flatMap((plan) =>
      (pair.planPrices ?? [])
        .filter((r) => r.planId === plan.id && (!country || r.country === country))
        .map((r) => ({ plan, price: Number(r.basePrice), currency: r.currency, tax: Number(r.taxRate ?? 0) })),
    );
  }
  return plans.map((plan) => ({ plan, price: Number(plan.basePrice), currency: plan.currency || defaultCurrency, tax: 0 }));
}

/** The currency most of a plan's paid offers are in (ties → alphabetical), so one country shows one currency. */
function dominantCurrency(offers: Offer[]): string {
  const paid = offers.filter((o) => o.price > 0);
  const counts = new Map<string, number>();
  for (const o of paid.length ? paid : offers) counts.set(o.currency, (counts.get(o.currency) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

/** Most plan cards the home page shows at once. */
export const MAX_PRICING_CARDS = 6;

/**
 * One row per plan name (and currency) across every migration pair, with the lowest and highest price it is
 * sold at. Pair prices differ, so the home page shows a range, not one number.
 *
 * With a `country`, only that country's price-list rows count and each plan shows in a single currency
 * (free offers there are free in any currency, so they join the range as 0). Pairs without a price list are
 * sold anywhere in the plan's own currency, so they take part in every country.
 */
export function summarisePlans(
  pairs: readonly Pair[],
  defaultCurrency = 'USD',
  country: string | null = null,
): PlanSummary[] {
  let offers = pairs
    .flatMap((pair) => offersOf(pair, country, defaultCurrency))
    .filter((o) => o.plan.name && Number.isFinite(o.price) && o.price >= 0);

  if (country) {
    const byName = new Map<string, Offer[]>();
    for (const o of offers) byName.set(o.plan.name.trim().toLowerCase(), [...(byName.get(o.plan.name.trim().toLowerCase()) ?? []), o]);
    offers = [...byName.values()].flatMap((group) => {
      const currency = dominantCurrency(group);
      return group.filter((o) => o.price === 0 || o.currency === currency).map((o) => ({ ...o, currency }));
    });
  }

  const map = new Map<string, PlanSummary>();
  for (const { plan, price, currency, tax } of offers) {
    const key = `${plan.name.trim().toLowerCase()}|${currency}`;
    const row = map.get(key);
    if (!row) {
      map.set(key, {
        key,
        name: plan.name.trim(),
        currency,
        min: price,
        max: price,
        minPaid: price > 0 ? price : 0,
        hasFree: price === 0,
        taxRate: tax,
        pairCount: 1,
        history: plan.history,
        support: plan.support,
        features: [...(plan.features ?? [])],
        popular: !!plan.popular,
      });
    } else {
      row.min = Math.min(row.min, price);
      row.max = Math.max(row.max, price);
      if (price > 0) row.minPaid = row.minPaid > 0 ? Math.min(row.minPaid, price) : price;
      if (price === 0) row.hasFree = true;
      row.taxRate = Math.max(row.taxRate, tax);
      row.pairCount += 1;
      row.popular = row.popular || !!plan.popular;
      for (const f of plan.features ?? []) if (!row.features.includes(f)) row.features.push(f);
    }
  }
  return [...map.values()].sort((a, b) => rank(a.name) - rank(b.name) || a.min - b.min || a.currency.localeCompare(b.currency));
}
