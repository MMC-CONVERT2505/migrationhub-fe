import { describe, expect, it } from 'vitest';
import type { Pair, Plan } from '@/types';
import {
  canonicalSlug,
  dedicatedDetailsPath,
  dedicatedFlowRedirect,
  dedicatedFreePlan,
  isDedicatedPair,
  newFlowToken,
  skipsPlanStep,
} from '../dedicatedFlow';

const plan = (over: Partial<Plan> = {}): Plan => ({ id: 'p-free', name: 'Free', basePrice: 0, ...over } as Plan);
const pair = (src: string, dst: string, over: Partial<Pair> = {}): Pair =>
  ({ id: 7, src, dst, plans: [], isFree: false, ...over } as Pair);
const reckon = (over: Partial<Pair> = {}) => pair('xero', 'reckon', { isFree: true, plans: [plan()], ...over });
const flow = { slug: 'xero-to-reckon', token: 'tok-1' };

describe('isDedicatedPair / canonicalSlug', () => {
  it('only Xero → Reckon, Xero → MYOB and QBO → MYOB are dedicated, whatever case the keys use', () => {
    expect(isDedicatedPair(reckon())).toBe(true);
    expect(isDedicatedPair(pair('Xero', 'Reckon'))).toBe(true);
    expect(canonicalSlug(pair('Xero', 'Reckon'))).toBe('xero-to-reckon');
    for (const p of [pair('xero', 'myob'), pair('QBO', 'MYOB')]) expect(isDedicatedPair(p)).toBe(true);
    // the opposite direction, and every other pair, stay normal
    for (const p of [pair('myob', 'qbo'), pair('myob', 'xero'), pair('reckon', 'xero'), pair('qbo', 'xero'), pair('xero', 'qbo')]) expect(isDedicatedPair(p)).toBe(false);
    expect(isDedicatedPair(null)).toBe(false);
  });
});

describe('dedicatedFlowRedirect', () => {
  it('without an active flow every pair, the dedicated one included, is a normal pair (Hub entry, pasted URLs)', () => {
    for (const p of [reckon(), pair('xero', 'myob'), pair('qbo', 'xero')])
      for (const step of ['plan', 'details'] as const) {
        expect(dedicatedFlowRedirect({ pair: p, flow: null, urlToken: null, step })).toBeNull();
        expect(dedicatedFlowRedirect({ pair: p, flow: null, urlToken: 'guess', step })).toBeNull();
      }
  });

  it('inside the deep-link flow, the plan step proceeds and the details step needs this tab\'s token', () => {
    expect(dedicatedFlowRedirect({ pair: reckon(), flow, urlToken: null, step: 'plan' })).toBeNull();
    expect(dedicatedFlowRedirect({ pair: reckon(), flow, urlToken: 'tok-1', step: 'details' })).toBeNull();
  });

  it('a missing or wrong token inside the flow is put right, not blocked', () => {
    const fixed = dedicatedDetailsPath(flow);
    expect(dedicatedFlowRedirect({ pair: reckon(), flow, urlToken: null, step: 'details' })).toBe(fixed);
    expect(dedicatedFlowRedirect({ pair: reckon(), flow, urlToken: 'other', step: 'details' })).toBe(fixed);
  });

  it('inside the flow, any other pair is sent back to the flow', () => {
    const back = '/migration/xero-to-reckon/customer-details?flow=tok-1';
    for (const step of ['plan', 'details'] as const)
      expect(dedicatedFlowRedirect({ pair: pair('qbo', 'xero'), flow, urlToken: null, step })).toBe(back);
  });

  it('the token is URL-encoded', () => {
    expect(dedicatedDetailsPath({ slug: 'xero-to-reckon', token: 'a b&c' })).toBe('/migration/xero-to-reckon/customer-details?flow=a%20b%26c');
  });
});

describe('dedicatedFreePlan', () => {
  it('takes the zero-priced plan of a free pair', () => {
    const free = plan({ id: 'f' });
    expect(dedicatedFreePlan(reckon({ plans: [plan({ id: 'paid', basePrice: 99 }), free] }))).toBe(free);
  });
  it('a free pair with no plans proceeds with none', () => {
    expect(dedicatedFreePlan(reckon({ plans: [] }))).toBe('none');
  });
  it('needs a manual choice when the pair is not free, or has no free plan, or only an unlimited free one', () => {
    expect(dedicatedFreePlan(reckon({ isFree: false }))).toBeNull();
    expect(dedicatedFreePlan(reckon({ plans: [plan({ basePrice: 49 })] }))).toBeNull();
    expect(dedicatedFreePlan(reckon({ plans: [plan({ isInception: true })] }))).toBeNull();
  });
});

describe('newFlowToken', () => {
  it('is unguessable and unique per call', () => {
    const a = newFlowToken();
    expect(a.length).toBeGreaterThanOrEqual(16);
    expect(newFlowToken()).not.toBe(a);
  });
});

describe('skipsPlanStep', () => {
  it('the dedicated flow has no plan step when a Free plan is taken for the person', () => {
    expect(skipsPlanStep(reckon(), flow)).toBe(true);
    expect(skipsPlanStep(reckon({ plans: [] }), flow)).toBe(true); // free pair with no plans
  });
  it('keeps the plan step when there is nothing to take, no flow, or another pair', () => {
    expect(skipsPlanStep(reckon({ isFree: false }), flow)).toBe(false);
    expect(skipsPlanStep(reckon({ plans: [plan({ basePrice: 49 })] }), flow)).toBe(false);
    expect(skipsPlanStep(reckon(), null)).toBe(false);
    expect(skipsPlanStep(pair('xero', 'myob', { isFree: true, plans: [plan()] }), flow)).toBe(false);
    expect(skipsPlanStep(null, flow)).toBe(false);
  });
});

describe('MYOB direct links (price-listed, Australia and New Zealand free)', () => {
  const anz = (dst: string, src: string) => {
    const basic = plan({ id: 'plan-basic', name: 'Basic' });
    const row = (country: string) => ({ planId: 'plan-basic', country, currency: country === 'Australia' ? 'AUD' : 'AUD', basePrice: 0, extraYearPrice: 150, taxRate: 0 });
    return pair(src, dst, { isFree: true, plans: [basic], planPrices: [row('Australia'), row('New Zealand')] } as Partial<Pair>);
  };
  const flows = {
    xeroMyob: { slug: 'xero-to-myob', token: 't-x' },
    qboMyob: { slug: 'qbo-to-myob', token: 't-q' },
  };

  it('takes the Basic plan, which costs nothing in either country', () => {
    for (const p of [anz('myob', 'xero'), anz('myob', 'qbo')]) {
      expect(dedicatedFreePlan(p)).toMatchObject({ id: 'plan-basic' });
      expect(skipsPlanStep(p, { slug: canonicalSlug(p), token: 't' })).toBe(true);
    }
  });

  it('keeps the plan step if the price list has no free plan for the first country', () => {
    const p = anz('myob', 'xero');
    p.planPrices = p.planPrices!.map((r) => ({ ...r, basePrice: 389 }));
    expect(dedicatedFreePlan(p)).toBeNull();
    expect(skipsPlanStep(p, flows.xeroMyob)).toBe(false);
  });

  it('inside either MYOB flow, the other pairs (Reckon included) go back to that flow', () => {
    expect(dedicatedFlowRedirect({ pair: reckon(), flow: flows.qboMyob, urlToken: null, step: 'plan' })).toBe(dedicatedDetailsPath(flows.qboMyob));
    expect(dedicatedFlowRedirect({ pair: anz('myob', 'qbo'), flow: flows.xeroMyob, urlToken: 't-x', step: 'details' })).toBe(dedicatedDetailsPath(flows.xeroMyob));
    expect(dedicatedFlowRedirect({ pair: pair('myob', 'qbo'), flow: flows.qboMyob, urlToken: null, step: 'details' })).toBe(dedicatedDetailsPath(flows.qboMyob));
  });

  it('their own details step needs their own token', () => {
    expect(dedicatedFlowRedirect({ pair: anz('myob', 'xero'), flow: flows.xeroMyob, urlToken: 't-x', step: 'details' })).toBeNull();
    expect(dedicatedFlowRedirect({ pair: anz('myob', 'xero'), flow: flows.xeroMyob, urlToken: 't-q', step: 'details' })).toBe(dedicatedDetailsPath(flows.xeroMyob));
  });
});
