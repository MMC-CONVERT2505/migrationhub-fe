import { FY_END_DATE_MAP } from '@/constants/financialYear';

export interface FinancialYearRange {
  start: Date | null; // null for "inception to date" plans
  end: Date;
}

/**
 * Computes the migration date range from the customer's financial-year-end and the
 * selected plan's coverage. `years` is the total number of financial years to
 * migrate (current partial FY + historical), matching Plan.years; inception plans
 * cover everything up to today and so have no fixed start.
 *
 * Ported from the QBO2XERO front-end's calculateMigrationPeriod so the figure shown
 * on the order summary matches the range the backend stores at migration creation.
 */
export function calculateMigrationPeriod(
  financialYearEnd: string | null | undefined,
  years: number | null | undefined,
  isInception = false,
): FinancialYearRange | null {
  // A single "now" so the end date and the "is this FY complete yet?" check can
  // never disagree across a midnight tick.
  const now = new Date();

  // Inception plans cover everything up to today — no fixed start.
  if (isInception) return { start: null, end: now };

  const fyEnd = financialYearEnd ? FY_END_DATE_MAP[financialYearEnd] : undefined;
  // `years` must be a positive whole number — reject undefined/NaN/0/negatives;
  // `< 1` alone would let NaN slip through (NaN < 1 is false).
  if (!fyEnd || !Number.isFinite(years) || (years as number) < 1) return null;
  const fyCount = Math.floor(years as number);

  // Most recent *complete* financial year end. The FY-end day itself counts as
  // complete (now carries a time-of-day, so it is strictly after midnight on that
  // date); only when today falls before this year's FY end do we step back a year.
  let fyEndYear = now.getFullYear();
  if (now < new Date(fyEndYear, fyEnd.month, fyEnd.day)) fyEndYear -= 1;

  // Start = first day of the financial year `fyCount` years back, i.e. the day
  // after that year's FY end. Computed as the 1st of the *month after* the FY-end
  // month (not FY-end + 1 day) so it stays correct across the Dec→Jan rollover
  // and avoids the 28-Feb → 29-Feb leap-year slip. The Date constructor
  // normalises month 12 to January of the following year.
  const startFyYear = fyEndYear - fyCount + 1;
  let start = new Date(startFyYear, fyEnd.month + 1, 1);

  // On the FY-end day itself (1-year plans) the current FY has only just closed
  // and the next one starts tomorrow, which would push `start` past `end`. Fall
  // back to the FY that just ended so the range stays valid (start ≤ end).
  if (start > now) start = new Date(startFyYear - 1, fyEnd.month + 1, 1);

  return { start, end: now };
}

function formatDay(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Human-readable range for the order summary, e.g. "1 Apr 2025 – 20 Jun 2026". */
export function formatFinancialRange(range: FinancialYearRange | null): string | null {
  if (!range) return null;
  return range.start
    ? `${formatDay(range.start)} – ${formatDay(range.end)}`
    : `Inception – ${formatDay(range.end)}`;
}
