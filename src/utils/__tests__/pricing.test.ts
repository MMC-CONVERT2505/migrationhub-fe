import { describe, expect, it } from 'vitest';
import { summarisePlans } from '../pricing';
import type { Pair } from '@/types';

const pair = (plans: Array<Record<string, unknown>>) => ({ plans } as unknown as Pair);

describe('summarisePlans', () => {
  it('groups by plan name and keeps the price range', () => {
    const out = summarisePlans([
      pair([{ name: 'Basic', basePrice: 389, currency: 'AUD', history: 'h', support: 's', features: ['a'] }]),
      pair([{ name: 'basic', basePrice: 489.5, currency: 'AUD', history: 'h', support: 's', features: ['a', 'b'] }]),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: 'Basic', min: 389, max: 489.5, pairCount: 2, features: ['a', 'b'] });
  });
  it('keeps currencies apart and orders Free → Basic → Standard → unknown', () => {
    const out = summarisePlans([
      pair([
        { name: 'Zeta', basePrice: 5, features: [] },
        { name: 'Standard', basePrice: 589, currency: 'AUD', features: [] },
        { name: 'Free', basePrice: 0, currency: 'AUD', features: [] },
        { name: 'Basic', basePrice: 389, currency: 'USD', features: [] },
        { name: 'Basic', basePrice: 389, currency: 'AUD', features: [] },
      ]),
    ]);
    expect(out.map((p) => `${p.name}/${p.currency}`)).toEqual(['Free/AUD', 'Basic/AUD', 'Basic/USD', 'Standard/AUD', 'Zeta/USD']);
  });
  it('skips bad rows and tolerates pairs with no plans', () => {
    const out = summarisePlans([
      pair([{ name: '', basePrice: 1 }, { name: 'X', basePrice: Number.NaN }, { name: 'Y', basePrice: -3 }]),
      { plans: undefined } as unknown as Pair,
    ]);
    expect(out).toEqual([]);
  });
});
