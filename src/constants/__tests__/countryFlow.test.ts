import { describe, expect, it } from 'vitest';
import type { InquiryDetails, Pair } from '@/types';
import { findSelectedPlan, isFreeSelection, resolveFlowRedirect } from '../migrationFlow';
import { dedicatedFreePlan } from '../dedicatedFlow';

const plan = (id: string, name: string) => ({ id, name, history: 'h', support: 's', basePrice: 389, features: [] });
const row = (planId: string, country: string, basePrice: number, currency = 'AUD', taxRate = 0) =>
  ({ planId, country, currency, basePrice, extraYearPrice: 150, taxRate });

const paidPair = {
  id: 'p1', src: 'qbo', dst: 'xero', isFree: false, plans: [plan('b', 'Basic')],
  planPrices: [row('b', 'Australia', 549), row('b', 'India', 35000, 'INR', 18)],
} as unknown as Pair;
// Free everywhere, flagged free (Xero → Reckon in production).
const reckon = {
  id: 'p2', src: 'xero', dst: 'reckon', isFree: true, plans: [plan('b', 'Basic')],
  planPrices: [row('b', 'Australia', 0), row('b', 'New Zealand', 0)],
} as unknown as Pair;
const inquiry = { id: 1, migrationPairId: 'p1', country: 'Australia (AUD)' } as unknown as InquiryDetails;

describe('country-priced flow', () => {
  it('a plan is only selectable once the country is known and sells it', () => {
    expect(findSelectedPlan(paidPair, 'b', null)).toBeNull();
    expect(findSelectedPlan(paidPair, 'b', 'Canada')).toBeNull();
    expect(findSelectedPlan(paidPair, 'b', 'India')).toMatchObject({ basePrice: 35000, currency: 'INR', taxRate: 18 });
  });

  it('without a country the visitor is sent back to the plan step, never to payment', () => {
    const base = { pair: paidPair, planId: 'b', inquiry };
    expect(resolveFlowRedirect('details', { ...base, country: null })).toBe('/migration/qbo-to-xero/plan');
    expect(resolveFlowRedirect('payment', { ...base, country: 'Canada' })).toBe('/migration/qbo-to-xero/plan');
    expect(resolveFlowRedirect('payment', { ...base, country: 'Australia' })).toBeNull();
  });

  it('free is decided by the country row, not the pair flag, on a price-listed pair', () => {
    const au = findSelectedPlan(paidPair, 'b', 'Australia');
    expect(isFreeSelection(paidPair, au)).toBe(false);
    const flaggedFreeButPriced = { ...paidPair, isFree: true } as Pair;
    expect(isFreeSelection(flaggedFreeButPriced, au)).toBe(false);
    expect(isFreeSelection(reckon, findSelectedPlan(reckon, 'b', 'Australia'))).toBe(true);
    // free base but paid extra years is not free
    expect(isFreeSelection(reckon, findSelectedPlan(reckon, 'b', 'Australia'), 300)).toBe(false);
  });

  it('payment needs the details country to be the priced country; after paying nothing is re-checked', () => {
    const withCountry = (country: string) => ({ ...inquiry, country }) as unknown as InquiryDetails;
    const s = (c: string, extra = {}) => ({ pair: paidPair, planId: 'b', country: 'Australia', inquiry: withCountry(c), ...extra });
    expect(resolveFlowRedirect('payment', s('Australia (AUD)'))).toBeNull();
    // they changed the country on the plan step after submitting details → confirm the details again
    expect(resolveFlowRedirect('payment', s('India (INR)'))).toBe('/migration/qbo-to-xero/customer-details');
    expect(resolveFlowRedirect('success', s('India (INR)'))).toBe('/migration/qbo-to-xero/customer-details');
    // returning from the payment provider: the order is settled, never bounce them
    expect(resolveFlowRedirect('success', s('India (INR)', { paymentId: '12' }))).toBeNull();
  });

  it('dedicated flow: the free plan it takes is resolvable with the country it starts from (no redirect loop)', () => {
    const free = dedicatedFreePlan(reckon);
    expect(free).toMatchObject({ id: 'b', basePrice: 0 });
    // Plan step sets country = first offered; details must then accept the plan.
    const state = { pair: reckon, planId: 'b', country: 'Australia', inquiry: null };
    expect(resolveFlowRedirect('details', state)).toBeNull();
    // Without a country the plan would not resolve — this is what looped before the fix.
    expect(resolveFlowRedirect('details', { ...state, country: null })).toBe('/migration/xero-to-reckon/plan');
  });
});
