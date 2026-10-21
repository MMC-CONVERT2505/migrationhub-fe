import type { Pair, Plan } from '@/types';

export interface PlanSummary {
  key: string;
  name: string;
  currency: string;
  min: number;
  max: number;
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

/**
 * One row per plan name (and currency) across every migration pair, with the lowest and
 * highest price it is sold at. Pair prices differ, so the home page shows a range, not one number.
 */
export function summarisePlans(pairs: readonly Pair[], defaultCurrency = 'USD'): PlanSummary[] {
  const map = new Map<string, PlanSummary>();
  for (const pair of pairs) {
    for (const plan of pair.plans ?? ([] as Plan[])) {
      const price = Number(plan.basePrice);
      if (!plan.name || !Number.isFinite(price) || price < 0) continue;
      const currency = plan.currency || defaultCurrency;
      const key = `${plan.name.trim().toLowerCase()}|${currency}`;
      const row = map.get(key);
      if (!row) {
        map.set(key, {
          key,
          name: plan.name.trim(),
          currency,
          min: price,
          max: price,
          pairCount: 1,
          history: plan.history,
          support: plan.support,
          features: [...(plan.features ?? [])],
          popular: !!plan.popular,
        });
      } else {
        row.min = Math.min(row.min, price);
        row.max = Math.max(row.max, price);
        row.pairCount += 1;
        row.popular = row.popular || !!plan.popular;
        for (const f of plan.features ?? []) if (!row.features.includes(f)) row.features.push(f);
      }
    }
  }
  return [...map.values()].sort((a, b) => rank(a.name) - rank(b.name) || a.min - b.min || a.currency.localeCompare(b.currency));
}
