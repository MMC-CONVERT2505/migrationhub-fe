import { describe, expect, it } from 'vitest';
import {
  FLOW_STEPS,
  flowSteps,
  usesFreePairBenefits,
  FREE_PAIR_BENEFITS,
  FLOW_PAGE_STEP,
  flowStepNumber,
  resolveFlowRedirect,
  type FlowState,
} from '../migrationFlow';
import { pairCustomerPath, pairDetailsPath, pairPlanPath } from '@/utils/platformMap';
import type { InquiryDetails, Pair, Plan } from '@/types';

const plan = (over: Partial<Plan> = {}): Plan => ({
  id: 'p-basic', name: 'Basic', history: '1 year', support: 'Email', basePrice: 389, features: [], ...over,
});
const pair = (over: Partial<Pair> = {}): Pair => ({
  id: 7, src: 'QBO', dst: 'Xero', srcColor: '', dstColor: '', srcAbbr: 'Q', dstAbbr: 'X',
  count: '', status: 'paid', isFree: false, plans: [plan(), plan({ id: 'p-std', name: 'Standard', basePrice: 589 })],
  url: null, toolUrl: null, ...over,
});
const inquiry = (over: Partial<InquiryDetails> = {}): InquiryDetails => ({
  id: 1, name: 'A', email: 'a@b.co', phone: '+61400', entityName: 'Acme', migrationPairId: '7', editToken: 't', ...over,
});
const state = (over: Partial<FlowState> = {}): FlowState => ({
  pair: pair(), planId: 'p-basic', inquiry: inquiry(), ...over,
});

describe('stepper mapping', () => {
  it('has the four steps in order', () => {
    expect(FLOW_STEPS.map((s) => s.label)).toEqual(['Prepare', 'Pay', 'Connect', 'Migrate']);
  });

  it('maps pages to steps: Plan + Details = Prepare, Payment + Success = Pay, login = Connect, tracker = Migrate', () => {
    expect(FLOW_PAGE_STEP).toEqual({
      plan: 'prepare', details: 'prepare', payment: 'pay', success: 'pay', connect: 'connect', track: 'migrate',
    });
    expect(['plan', 'details', 'payment', 'success', 'connect', 'track'].map((p) => flowStepNumber(p as never)))
      .toEqual([1, 1, 2, 2, 3, 4]);
  });
});

describe('free flow stepper', () => {
  it('drops the Pay stage: Prepare, Connect, Migrate', () => {
    expect(flowSteps(true).map((s) => s.label)).toEqual(['Prepare', 'Connect', 'Migrate']);
    expect(flowSteps(false).map((s) => s.label)).toEqual(['Prepare', 'Pay', 'Connect', 'Migrate']);
  });
  it('numbers pages against the three-step list; the success hand-off counts as Connect', () => {
    expect(['plan', 'details', 'success', 'connect', 'track'].map((p) => flowStepNumber(p as never, true))).toEqual([1, 1, 2, 2, 3]);
  });
});

describe('free pair plan presentation', () => {
  it('applies only to a zero-cost plan on a free pair', () => {
    expect(usesFreePairBenefits(pair({ isFree: true }), plan({ basePrice: 0 }))).toBe(true);
    expect(usesFreePairBenefits(pair({ isFree: true }), plan({ basePrice: 389 }))).toBe(false);
    expect(usesFreePairBenefits(pair({ isFree: false }), plan({ basePrice: 0 }))).toBe(false);
    expect(usesFreePairBenefits(null, plan({ basePrice: 0 }))).toBe(false);
  });
  it('lists exactly the three agreed benefits', () => {
    expect([...FREE_PAIR_BENEFITS]).toEqual(['All data categories', 'Email + Phone support', 'Quality Analysis Report']);
  });
});

describe('flow paths', () => {
  it('sends the home page entry (pairDetailsPath) to the Plan page', () => {
    expect(pairDetailsPath(pair())).toBe('/migration/qbo-to-xero/plan');
    expect(pairPlanPath(pair())).toBe('/migration/qbo-to-xero/plan');
    expect(pairCustomerPath(pair())).toBe('/migration/qbo-to-xero/customer-details');
  });
});

describe('resolveFlowRedirect — earliest incomplete step', () => {
  it('no pair → home, from every page', () => {
    for (const page of ['plan', 'details', 'payment', 'success'] as const) {
      expect(resolveFlowRedirect(page, state({ pair: null }))).toBe('/');
    }
  });

  it('plan page always renders once a pair exists', () => {
    expect(resolveFlowRedirect('plan', state({ planId: null, inquiry: null }))).toBeNull();
  });

  it('details without a plan → plan page', () => {
    expect(resolveFlowRedirect('details', state({ planId: null }))).toBe('/migration/qbo-to-xero/plan');
  });

  it('ignores a plan id that belongs to a different pair', () => {
    expect(resolveFlowRedirect('details', state({ planId: 'other-pairs-plan' }))).toBe('/migration/qbo-to-xero/plan');
  });

  it('payment without details → customer details; without plan → plan page', () => {
    expect(resolveFlowRedirect('payment', state({ inquiry: null }))).toBe('/migration/qbo-to-xero/customer-details');
    expect(resolveFlowRedirect('payment', state({ planId: null, inquiry: null }))).toBe('/migration/qbo-to-xero/plan');
  });

  it('does not reuse an inquiry created for another pair', () => {
    expect(resolveFlowRedirect('payment', state({ inquiry: inquiry({ migrationPairId: '99' }) })))
      .toBe('/migration/qbo-to-xero/customer-details');
  });

  it('payment renders for a complete paid selection', () => {
    expect(resolveFlowRedirect('payment', state())).toBeNull();
  });

  it('free plan skips the payment page straight to success', () => {
    const free = pair({ plans: [plan({ id: 'p-free', name: 'Free', basePrice: 0 })] });
    expect(resolveFlowRedirect('payment', state({ pair: free, planId: 'p-free' }))).toBe('/payment/success');
    expect(resolveFlowRedirect('success', state({ pair: free, planId: 'p-free' }))).toBeNull();
  });

  it('free pair with no plans needs no plan', () => {
    const free = pair({ isFree: true, plans: [] });
    expect(resolveFlowRedirect('details', state({ pair: free, planId: null }))).toBeNull();
  });

  it('paid pair with no plans is sent to the plan page (which shows retry / contact)', () => {
    expect(resolveFlowRedirect('details', state({ pair: pair({ plans: [] }), planId: null }))).toBe('/migration/qbo-to-xero/plan');
  });

  it('success needs a payment for a paid plan, unless payment is skipped', () => {
    expect(resolveFlowRedirect('success', state())).toBe('/payment');
    expect(resolveFlowRedirect('success', state({ paymentId: '73' }))).toBeNull();
    expect(resolveFlowRedirect('success', state({ paymentSkipped: true }))).toBeNull();
  });
});

describe('Operation Team payment skip', () => {
  it('payment page sends a skipped-payment order straight to Start migration', () => {
    expect(resolveFlowRedirect('payment', state({ paymentSkipped: true }))).toBe('/payment/success');
    expect(resolveFlowRedirect('payment', state({ paymentSkipped: false }))).toBeNull();
  });
  it('success page accepts a skipped-payment order without a payment id', () => {
    expect(resolveFlowRedirect('success', state({ paymentSkipped: true, paymentId: null }))).toBeNull();
  });
});
