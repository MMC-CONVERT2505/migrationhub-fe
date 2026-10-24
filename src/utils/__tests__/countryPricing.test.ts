import { describe, expect, it } from 'vitest';
import type { Pair } from '@/types';
import { normalizeCountry, offeredCountries, orderTotals, pricedPlans, validCountry } from '../countryPricing';
import { formatCurrency } from '../format';

const plan = (id: string, name: string) => ({ id, name, history: '', support: '', basePrice: 389, features: [] });
const pair = {
  src: 'qbo', dst: 'xero', plans: [plan('b', 'Basic'), plan('s', 'Standard')], isFree: false,
  planPrices: [
    { planId: 'b', country: 'India', currency: 'INR', basePrice: 35000, extraYearPrice: 15000, taxRate: 18 },
    { planId: 'b', country: 'Australia', currency: 'AUD', basePrice: 549, extraYearPrice: 150, taxRate: 0 },
    { planId: 's', country: 'Australia', currency: 'AUD', basePrice: 849, extraYearPrice: 150, taxRate: 0 },
  ],
} as unknown as Pair;

describe('countryPricing', () => {
  it('normalises form labels and rejects unknown countries', () => {
    expect(normalizeCountry('Australia (AUD)')).toBe('Australia');
    expect(normalizeCountry(' india ')).toBe('India');
    expect(normalizeCountry('Narnia')).toBeNull();
  });

  it('offers only priced countries, and never substitutes one', () => {
    expect(offeredCountries(pair)).toEqual(['Australia', 'India']);
    expect(validCountry(pair, 'Canada')).toBeNull();
    expect(pricedPlans(pair, null)).toEqual([]);
  });

  it('prices plans from the country row and drops plans not sold there', () => {
    const au = pricedPlans(pair, 'Australia');
    expect(au.map((p) => [p.name, p.basePrice, p.currency])).toEqual([['Basic', 549, 'AUD'], ['Standard', 849, 'AUD']]);
    const inr = pricedPlans(pair, 'India');
    expect(inr).toHaveLength(1);
    expect(inr[0]).toMatchObject({ basePrice: 35000, currency: 'INR', taxRate: 18 });
  });

  it('a pair without a price list keeps its plans as they are', () => {
    const legacy = { ...pair, planPrices: [] } as Pair;
    expect(pricedPlans(legacy, null)).toBe(legacy.plans);
  });

  it('adds GST on top, matching the server', () => {
    expect(orderTotals({ basePrice: 35000, taxRate: 18 }, 30000)).toEqual({ subtotal: 65000, tax: 11700, total: 76700 });
    expect(orderTotals({ basePrice: 549 }, 0)).toEqual({ subtotal: 549, tax: 0, total: 549 });
    expect(orderTotals(null, 0).total).toBe(0);
  });

  it('formats currencies unambiguously', () => {
    expect(formatCurrency(549, 'AUD')).toBe('A$549');
    expect(formatCurrency(189, 'GBP')).toBe('£189');
    expect(formatCurrency(35000, 'INR')).toBe('₹35,000');
    expect(formatCurrency(389)).toBe('$389');
    expect(formatCurrency(125000, 'INR')).toBe('₹1,25,000'); // lakh grouping for Indian customers
    expect(formatCurrency(1449, 'AUD')).toBe('A$1,449');
    expect(formatCurrency(10, 'XXXBAD')).toMatch(/10/); // an unknown code never throws
  });
});

describe('pair badge from the price list', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const entity = (isFree: boolean, rows: Array<[string, number]>) =>
    ({
      id: 'x', source: 'qbo', destination: 'freshbooks', displayName: 'x', isFree, plans: [],
      planPrices: rows.map(([country, basePrice]) => ({ planId: 'b', country, currency: 'USD', basePrice: String(basePrice), extraYearPrice: null, taxRate: '0' })),
    }) as never;

  it('free in some countries is region-based and names them; all free is free; none is paid', async () => {
    const { apiPairToUiPair } = await import('../platformMap');
    const mixed = apiPairToUiPair(entity(true, [['United States', 0], ['Canada', 0], ['India', 35000]]));
    expect(mixed).toMatchObject({ status: 'region', isFree: false, freeCountries: ['United States', 'Canada'] });
    expect(apiPairToUiPair(entity(false, [['Australia', 0], ['New Zealand', 0]]))).toMatchObject({ status: 'free', isFree: true });
    expect(apiPairToUiPair(entity(true, [['Australia', 549]]))).toMatchObject({ status: 'paid', isFree: false });
    expect(apiPairToUiPair(entity(true, []))).toMatchObject({ status: 'free', isFree: true }); // no list: the flag decides
  });
});

describe('admin switch for extra years', () => {
  const disabled = { ...plan('b', 'Basic'), extraYearPrice: null };
  const enabled = { ...plan('b', 'Basic'), extraYearPrice: 1 };
  const listed = (p: object) => ({ ...pair, plans: [p] }) as unknown as Pair;

  it('a plan the admin disabled stays disabled even though the country row has an extra-year price', () => {
    expect(pricedPlans(listed(disabled), 'Australia')[0].extraYearPrice).toBeNull();
  });

  it('an enabled plan takes the amount from the country row, not its own number', () => {
    expect(pricedPlans(listed(enabled), 'Australia')[0].extraYearPrice).toBe(150);
    expect(pricedPlans(listed(enabled), 'India')[0].extraYearPrice).toBe(15000);
  });
});
