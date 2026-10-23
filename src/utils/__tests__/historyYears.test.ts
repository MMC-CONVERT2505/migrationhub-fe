import { describe, expect, it } from 'vitest';
import { MAX_MIGRATION_YEARS, effectiveYears, historyLabel, yearOptions } from '../historyYears';

const plan = { years: 2, isInception: false };

describe('effectiveYears', () => {
  it('operator may extend beyond the plan', () => {
    expect(effectiveYears(plan, 6, true)).toBe(6);
    expect(effectiveYears(plan, MAX_MIGRATION_YEARS, true)).toBe(MAX_MIGRATION_YEARS);
  });
  it('anyone else is held to the plan', () => {
    expect(effectiveYears(plan, 6, false)).toBe(2);
  });
  it('never fewer than the plan, never past the limit, never fractional/NaN/null', () => {
    for (const v of [1, 2, 0, -3, MAX_MIGRATION_YEARS + 1, 4.5, Number.NaN, null, undefined]) expect(effectiveYears(plan, v as never, true)).toBe(2);
  });
  it('unlimited plans and missing plans have no year count', () => {
    expect(effectiveYears({ years: null, isInception: true }, 6, true)).toBeNull();
    expect(effectiveYears({ years: 2, isInception: true }, 6, true)).toBeNull();
    expect(effectiveYears(null, 6, true)).toBeNull();
  });
});

describe('historyLabel / yearOptions', () => {
  it('reads naturally', () => {
    expect(historyLabel(2)).toBe('Current Financial Year + 1 Historical Year');
    expect(historyLabel(6)).toBe('Current Financial Year + 5 Historical Years');
  });
  it('offers the plan coverage up to the limit, in order', () => {
    const o = yearOptions(plan);
    expect(o[0]).toBe(2);
    expect(o[o.length - 1]).toBe(MAX_MIGRATION_YEARS);
    expect(o).toEqual([...o].sort((a, b) => a - b));
  });
});

describe('customers on a plan that sells extra years', () => {
  const priced = { years: 2, isInception: false, extraYearPrice: 99 };
  it('may extend; operators too; plans with no price only for operators', async () => {
    const { canExtendPlan } = await import('../historyYears');
    expect(canExtendPlan(priced, false)).toBe(true);
    expect(canExtendPlan({ ...priced, extraYearPrice: 0 }, false)).toBe(true);
    expect(canExtendPlan({ ...priced, extraYearPrice: null }, false)).toBe(false);
    expect(canExtendPlan({ ...priced, extraYearPrice: null }, true)).toBe(true);
    expect(canExtendPlan({ years: null, isInception: true, extraYearPrice: 5 }, true)).toBe(false);
    expect(canExtendPlan(null, true)).toBe(false);
  });
  it('a customer gets the years they chose, held to the plan otherwise', () => {
    expect(effectiveYears(priced, 6, false)).toBe(6);
    expect(effectiveYears({ ...priced, extraYearPrice: null }, 6, false)).toBe(2);
    expect(effectiveYears(priced, 16, false)).toBe(2);
    expect(effectiveYears(priced, 1, false)).toBe(2);
  });
  it('extra years cost per year for customers, nothing for the Operation Team, never negative', async () => {
    const { extensionCost } = await import('../historyYears');
    expect(extensionCost(priced, 6, false)).toBe(396);
    expect(extensionCost(priced, 6, true)).toBe(0);
    expect(extensionCost(priced, 2, false)).toBe(0);
    expect(extensionCost(priced, 1, false)).toBe(0);
    expect(extensionCost(priced, null, false)).toBe(0);
    expect(extensionCost({ ...priced, extraYearPrice: 19.99 }, 5, false)).toBe(59.97);
    expect(extensionCost({ ...priced, extraYearPrice: null }, 6, false)).toBe(0);
  });
});
