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
  it('only Xero → Reckon is dedicated, whatever case the keys use', () => {
    expect(isDedicatedPair(reckon())).toBe(true);
    expect(isDedicatedPair(pair('Xero', 'Reckon'))).toBe(true);
    expect(canonicalSlug(pair('Xero', 'Reckon'))).toBe('xero-to-reckon');
    for (const p of [pair('xero', 'myob'), pair('reckon', 'xero'), pair('qbo', 'xero')]) expect(isDedicatedPair(p)).toBe(false);
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
