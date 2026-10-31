import { describe, expect, it } from 'vitest';
import { effectiveDateRange, formatDateRange, isValidDateRange, isoDay, parseIsoDay, rangeDays, validateDateRange } from '../dateRange';

const TODAY = new Date(2026, 9, 30, 12, 0, 0); // 30 Oct 2026, local
const errs = (from: string, to: string) => validateDateRange({ from, to }, TODAY);

describe('parseIsoDay', () => {
  it('accepts real days (leap day only in a leap year) and refuses roll-overs and other shapes', () => {
    expect(parseIsoDay('2024-02-29')?.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    for (const bad of ['2025-02-29', '2026-02-30', '2026-13-01', '2026-04-31', '2026-1-5', '5/1/2026', '2026-01-05T00:00', '', null, undefined])
      expect(parseIsoDay(bad as string)).toBeNull();
  });
});

describe('validateDateRange', () => {
  it('a normal range is valid, and so are a single day, a year-end crossing and today', () => {
    for (const [a, b] of [['2024-07-01', '2025-06-30'], ['2025-03-15', '2025-03-15'], ['2025-12-31', '2026-01-01'], ['2026-10-01', '2026-10-30']])
      expect(errs(a, b)).toEqual({});
  });
  it('asks for both dates, per field', () => {
    expect(validateDateRange(null, TODAY)).toEqual({ from: 'Select a From date.', to: 'Select a To date.' });
    expect(errs('2025-01-01', '')).toEqual({ to: 'Select a To date.' });
    expect(errs('', '2025-01-01')).toEqual({ from: 'Select a From date.' });
  });
  it('flags a date that is not a real day on its own field', () => {
    expect(errs('2025-02-30', '2025-03-01').from).toBe('Enter a valid From date.');
    expect(errs('2025-01-01', '2025-13-01').to).toBe('Enter a valid To date.');
  });
  it('From after To, and a future To, are errors on To', () => {
    expect(errs('2025-06-02', '2025-06-01').to).toMatch(/before the From/);
    expect(errs('2026-10-01', '2026-10-31').to).toMatch(/future/);
  });
  it('allows just under 15 years and refuses 15 or more', () => {
    expect(errs('2011-11-01', '2026-10-30')).toEqual({});
    expect(errs('2011-10-30', '2026-10-30').to).toMatch(/shorter than 15 years/);
    expect(errs('2012-02-29', '2026-10-30')).toEqual({}); // a leap-day start is measured from its own date
  });
  it('judges "today" on the local calendar day, whatever the time', () => {
    expect(validateDateRange({ from: '2026-10-01', to: '2026-10-30' }, new Date(2026, 9, 30, 0, 0, 1))).toEqual({});
    expect(validateDateRange({ from: '2026-10-01', to: '2026-10-30' }, new Date(2026, 9, 30, 23, 59, 59))).toEqual({});
  });
});

describe('effectiveDateRange (what can reach an order)', () => {
  const ok = { from: '2024-07-01', to: '2025-06-30' };
  it('only the Operation Team, only a complete valid range', () => {
    expect(effectiveDateRange(ok, true, TODAY)).toBe(ok);
    expect(effectiveDateRange(ok, false, TODAY)).toBeNull(); // a customer, or a role that was lost
    expect(effectiveDateRange({ from: '2024-07-01', to: '' }, true, TODAY)).toBeNull(); // half filled
    expect(effectiveDateRange({ from: '2025-07-01', to: '2025-06-01' }, true, TODAY)).toBeNull(); // reversed
    expect(effectiveDateRange(null, true, TODAY)).toBeNull();
  });
  it('isValidDateRange agrees', () => {
    expect(isValidDateRange(ok, TODAY)).toBe(true);
    expect(isValidDateRange(null, TODAY)).toBe(false);
  });
});

describe('formatting', () => {
  it('reads dates as UTC so a timezone cannot shift a day', () => {
    expect(formatDateRange({ from: '2024-07-01', to: '2025-06-30' })).toBe('1 Jul 2024 – 30 Jun 2025');
    expect(formatDateRange({ from: '2025-03-15', to: '2025-03-15' })).toBe('15 Mar 2025');
  });
  it('isoDay is the local calendar day', () => {
    expect(isoDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('counts days inclusively', () => {
    expect(rangeDays({ from: '2025-03-15', to: '2025-03-15' })).toBe(1);
    expect(rangeDays({ from: '2024-02-28', to: '2024-03-01' })).toBe(3);
    expect(rangeDays({ from: '', to: '' })).toBe(0);
  });
});
