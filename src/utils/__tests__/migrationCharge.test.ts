import { describe, expect, it } from 'vitest';
import { chargeSummary, historyText } from '../migrationCharge';

const base = { migrationPair: { isFree: false }, plan: { basePrice: 389, currency: 'AUD', history: 'Current Financial Year + 1 Historical Year' } };

describe('chargeSummary', () => {
  it('shows what was actually charged — not plan price × anything', () => {
    expect(chargeSummary({ ...base, payment: { amount: '539.00', status: 'Success' } })).toEqual({ label: 'Total paid', value: 'A$539' });
    expect(chargeSummary({ ...base, payment: { amount: 389, status: 'success' } }).value).toBe('A$389');
  });
  it('a payment that has not settled is not "paid"', () => {
    expect(chargeSummary({ ...base, payment: { amount: 389, status: 'Pending' } })).toEqual({ label: 'Payment', value: 'Pending' });
    expect(chargeSummary({ ...base, payment: { amount: 389, status: 'Failed' } }).value).toBe('Failed');
  });
  it('free, $0 plan and waiver are named as such', () => {
    expect(chargeSummary({ ...base, migrationPair: { isFree: true }, payment: null })).toEqual({ label: 'Total', value: 'Free' });
    expect(chargeSummary({ ...base, plan: { ...base.plan, basePrice: 0 }, payment: null }).value).toBe('Free');
    expect(chargeSummary({ ...base, paymentWaived: true, payment: null })).toEqual({ label: 'Charge', value: 'None' });
  });
  it('a paid order with no payment on record is flagged, never shown as paid', () => {
    expect(chargeSummary({ ...base, payment: null })).toEqual({ label: 'Payment', value: 'Not paid' });
  });
});

describe('historyText', () => {
  it('uses the extended years when present, the plan text otherwise, and ignores unlimited plans', () => {
    expect(historyText({ ...base, yearsOverride: 6 })).toBe('Current Financial Year + 5 Historical Years');
    expect(historyText({ ...base, yearsOverride: null })).toBe(base.plan.history);
    expect(historyText({ ...base, plan: { ...base.plan, isInception: true }, yearsOverride: 6 })).toBe(base.plan.history);
  });
});
