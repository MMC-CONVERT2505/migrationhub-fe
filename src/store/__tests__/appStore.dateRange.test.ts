import { beforeEach, describe, expect, it } from 'vitest';
import type { Pair } from '@/types';
import { useAppStore } from '../appStore';

const pair = (src: string, dst: string, id = 1) => ({ id, src, dst, plans: [], isFree: true } as unknown as Pair);
const range = { from: '2024-07-01', to: '2025-06-30' };
const s = () => useAppStore.getState();

beforeEach(() => useAppStore.getState().resetMigration());

describe('selectedDateRange (Operation Team custom period)', () => {
  it('starts empty', () => {
    expect(s().selectedDateRange).toBeNull();
  });

  it('years and an exact period are alternatives: choosing one drops the other', () => {
    s().setSelectedYears(5);
    s().setSelectedDateRange(range);
    expect(s().selectedYears).toBeNull();
    expect(s().selectedDateRange).toEqual(range);
    s().setSelectedYears(3);
    expect(s().selectedDateRange).toBeNull();
    expect(s().selectedYears).toBe(3);
  });

  it('clearing the range does not touch the years', () => {
    s().setSelectedYears(4);
    s().setSelectedDateRange(null);
    expect(s().selectedYears).toBe(4);
  });

  it('a different pair is a different order: the period never carries over to it', () => {
    s().setSelectedPair(pair('xero', 'myob'));
    s().setSelectedDateRange(range);
    s().setSelectedPair(pair('qbo', 'xero', 2));
    expect(s().selectedDateRange).toBeNull();
  });

  it('the same pair re-resolved (listing refresh, deep link) keeps it', () => {
    s().setSelectedPair(pair('xero', 'myob'));
    s().setSelectedDateRange(range);
    s().setSelectedPair({ ...pair('xero', 'myob'), isFree: false });
    expect(s().selectedDateRange).toEqual(range);
  });

  it('survives a plan or country change (dates do not depend on either)', () => {
    s().setSelectedDateRange(range);
    s().setSelectedPlanId('plan-basic');
    s().setSelectedCountry('Australia');
    expect(s().selectedDateRange).toEqual(range);
  });

  it('a finished or abandoned flow leaves nothing behind', () => {
    s().setSelectedDateRange(range);
    s().resetMigration();
    expect(s().selectedDateRange).toBeNull();
  });
});
