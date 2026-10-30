import type { DateRangeSelection } from '@/types';

/** Longest span an exact range may cover (the same limit as total financial years). */
export const MAX_RANGE_YEARS = 15;

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** "2026-02-30" is not a day: parse strictly, as UTC midnight, and refuse anything the calendar would roll over. */
export function parseIsoDay(value: string | null | undefined): Date | null {
  const m = ISO_DAY.exec(value ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? date : null;
}

/** Local calendar day as YYYY-MM-DD (what a date input's `max` expects). */
export const isoDay = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface DateRangeErrors {
  from?: string;
  to?: string;
}

/**
 * What is wrong with the chosen range, field by field (empty object = valid). The same rules the server enforces:
 * both dates, real days, From not after To, To not after today, shorter than 15 years. `today` is the person's own
 * calendar day; the server allows a day more for timezones ahead of UTC, so anything valid here is valid there.
 */
export function validateDateRange(range: DateRangeSelection | null | undefined, today: Date = new Date()): DateRangeErrors {
  const errors: DateRangeErrors = {};
  const from = range?.from ?? '';
  const to = range?.to ?? '';
  if (!from) errors.from = 'Select a From date.';
  if (!to) errors.to = 'Select a To date.';
  const start = from ? parseIsoDay(from) : null;
  const end = to ? parseIsoDay(to) : null;
  if (from && !start) errors.from = 'Enter a valid From date.';
  if (to && !end) errors.to = 'Enter a valid To date.';
  if (!start || !end) return errors;
  if (start > end) {
    errors.to = 'To date must not be before the From date.';
    return errors;
  }
  const todayDay = parseIsoDay(isoDay(today));
  if (todayDay && end > todayDay) {
    errors.to = 'To date cannot be in the future.';
    return errors;
  }
  const limit = Date.UTC(start.getUTCFullYear() + MAX_RANGE_YEARS, start.getUTCMonth(), start.getUTCDate());
  if (end.getTime() >= limit) errors.to = `Choose a period shorter than ${MAX_RANGE_YEARS} years.`;
  return errors;
}

export const isValidDateRange = (range: DateRangeSelection | null | undefined, today?: Date): boolean =>
  range != null && Object.keys(validateDateRange(range, today)).length === 0;

/**
 * The range that will really be sent: only for the Operation Team, and only when it is complete and valid. Anything
 * else (a customer, a half-filled form, a stale value) is null, so it can never reach an order.
 */
export function effectiveDateRange(
  range: DateRangeSelection | null | undefined,
  isOperator: boolean,
  today?: Date,
): DateRangeSelection | null {
  return isOperator && range && isValidDateRange(range, today) ? range : null;
}

/** "1 Jul 2024 – 30 Jun 2025", read as UTC so a timezone can never shift a day. */
export function formatDateRange(range: DateRangeSelection): string {
  const fmt = (iso: string): string => {
    const d = parseIsoDay(iso);
    return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : iso;
  };
  return range.from === range.to ? fmt(range.from) : `${fmt(range.from)} – ${fmt(range.to)}`;
}

/** Whole days covered, inclusive. */
export const rangeDays = (range: DateRangeSelection): number => {
  const a = parseIsoDay(range.from);
  const b = parseIsoDay(range.to);
  return a && b ? Math.round((b.getTime() - a.getTime()) / DAY_MS) + 1 : 0;
};
