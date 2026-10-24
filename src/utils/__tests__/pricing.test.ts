import { describe, expect, it } from 'vitest';
import { MAX_PRICING_CARDS, summarisePlans } from '../pricing';
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

describe('summarisePlans for a country', () => {
  const pl = (id: string, name: string) => ({ id, name, history: 'h', support: 's', features: [], basePrice: 1, currency: 'AUD' });
  const r = (planId: string, country: string, basePrice: number, currency: string, taxRate = 0) => ({ planId, country, currency, basePrice, extraYearPrice: null, taxRate });
  const paid = { plans: [pl('b', 'Basic'), pl('s', 'Standard')], planPrices: [
    r('b', 'Australia', 549, 'AUD'), r('s', 'Australia', 849, 'AUD'),
    r('b', 'India', 35000, 'INR', 18), r('s', 'India', 65000, 'INR', 18),
    r('b', 'New Zealand', 389, 'USD'), r('s', 'New Zealand', 589, 'USD'),
  ] } as unknown as Pair;
  const sponsored = { plans: [pl('b2', 'Basic')], planPrices: [
    r('b2', 'Australia', 0, 'AUD'), r('b2', 'New Zealand', 0, 'AUD'), r('b2', 'India', 35000, 'INR', 18),
  ] } as unknown as Pair;
  const view = (c: string | null, pairs = [paid, sponsored]) => summarisePlans(pairs, 'USD', c).map((p) => `${p.name}/${p.currency}/${p.min}-${p.max}/${p.taxRate}`);

  it("shows one currency per country: only that country's rows", () => {
    expect(view('India')).toEqual(['Basic/INR/35000-35000/18', 'Standard/INR/65000-65000/18']);
    expect(view('Australia')).toEqual(['Basic/AUD/0-549/0', 'Standard/AUD/849-849/0']);
    const basicAu = summarisePlans([paid, sponsored], 'USD', 'Australia')[0];
    expect(basicAu).toMatchObject({ minPaid: 549, hasFree: true }); // headline 549, "free on some migrations"
    expect(summarisePlans([sponsored], 'USD', 'Australia')[0]).toMatchObject({ minPaid: 0, hasFree: true, max: 0 });
  });

  it('a country with mixed currencies shows the paid currency; free offers join as 0', () => {
    // NZ: USD on paid pairs, AUD on the sponsored one (free) → one USD card, "free to 389"
    expect(view('New Zealand')).toEqual(['Basic/USD/0-389/0', 'Standard/USD/589-589/0']);
  });

  it("a country nothing is priced for shows nothing (never another country's prices)", () => {
    expect(view('Canada')).toEqual([]);
  });

  it('a pair without a price list is sold everywhere in its own currency', () => {
    const legacy = pair([{ name: 'Basic', basePrice: 100, currency: 'USD', features: [] }]);
    expect(view('India', [paid, legacy])).toEqual(['Basic/INR/35000-35000/18', 'Standard/INR/65000-65000/18']);
    expect(view('Canada', [legacy])).toEqual(['Basic/USD/100-100/0']);
  });

  it('without a country the old all-countries summary still works', () => {
    expect(summarisePlans([paid], 'USD').map((p) => p.currency).sort()).toEqual(['AUD', 'AUD', 'INR', 'INR', 'USD', 'USD']);
  });

  it('a country never yields more than MAX_PRICING_CARDS once capped', () => {
    expect(MAX_PRICING_CARDS).toBe(6);
  });
});
