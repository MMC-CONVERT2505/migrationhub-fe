import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSACTION_PLAN,
  TRANSACTION_PLANS,
  asksTransactionPlan,
  isTransactionPlan,
  transactionPlanLabel,
  transactionPlanToSend,
} from '../transactionPlans';

describe('migration type options', () => {
  it('are exactly the two the business offered, with the backend enum values', () => {
    expect(TRANSACTION_PLANS.map((p) => [p.value, p.label])).toEqual([
      ['PayrollWithTransaction', 'Payroll With Transaction'],
      ['Transaction', 'Transaction'],
    ]);
  });
  it('default to Payroll With Transaction, as before', () => {
    expect(DEFAULT_TRANSACTION_PLAN).toBe('PayrollWithTransaction');
  });
  it('have a label for each value and none for anything else', () => {
    expect(transactionPlanLabel('Transaction')).toBe('Transaction');
    expect(transactionPlanLabel('nope')).toBeNull();
    expect(transactionPlanLabel(null)).toBeNull();
  });
});

describe('isTransactionPlan', () => {
  it('accepts only the two real values', () => {
    expect(isTransactionPlan('Transaction')).toBe(true);
    expect(isTransactionPlan('PayrollWithTransaction')).toBe(true);
    for (const bad of ['transaction', 'Payroll', '', null, undefined, 1, {}, 'PayrollWithTransaction ']) expect(isTransactionPlan(bad)).toBe(false);
  });
});

describe('asksTransactionPlan: Xero → QuickBooks Online only', () => {
  it('is true for that pair, whatever the casing', () => {
    expect(asksTransactionPlan({ src: 'xero', dst: 'qbo' })).toBe(true);
    expect(asksTransactionPlan({ src: 'Xero', dst: 'QBO' })).toBe(true);
  });
  it('is false for the opposite direction and for every other pair', () => {
    expect(asksTransactionPlan({ src: 'qbo', dst: 'xero' })).toBe(false);
    for (const [src, dst] of [['xero', 'myob'], ['xero', 'reckon'], ['xero', 'prosaic'], ['myob', 'qbo'], ['qbo', 'myob'], ['qbo', 'freshbooks'], ['tally', 'zoho']]) {
      expect(asksTransactionPlan({ src, dst })).toBe(false);
    }
  });
  it('is false when there is no pair or the pair is incomplete', () => {
    expect(asksTransactionPlan(null)).toBe(false);
    expect(asksTransactionPlan(undefined)).toBe(false);
    expect(asksTransactionPlan({})).toBe(false);
    expect(asksTransactionPlan({ src: 'xero' })).toBe(false);
    expect(asksTransactionPlan({ src: 'xero', dst: null })).toBe(false);
  });
});

describe('transactionPlanToSend', () => {
  const xeroQbo = { src: 'xero', dst: 'qbo' };
  it("sends the customer's choice on Xero → QBO", () => {
    expect(transactionPlanToSend(xeroQbo, 'Transaction')).toBe('Transaction');
    expect(transactionPlanToSend(xeroQbo, 'PayrollWithTransaction')).toBe('PayrollWithTransaction');
  });
  it('falls back to the default rather than send something the API would reject', () => {
    for (const bad of [undefined, null, '', 'garbage', 'transaction', 42]) expect(transactionPlanToSend(xeroQbo, bad)).toBe('PayrollWithTransaction');
  });
  it('sends nothing on any other pair, even if a value was somehow held', () => {
    expect(transactionPlanToSend({ src: 'qbo', dst: 'xero' }, 'Transaction')).toBeUndefined();
    expect(transactionPlanToSend({ src: 'xero', dst: 'myob' }, 'PayrollWithTransaction')).toBeUndefined();
    expect(transactionPlanToSend(null, 'Transaction')).toBeUndefined();
  });
});
