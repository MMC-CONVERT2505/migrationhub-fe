// Single source of truth for financial-year-end labels used across the app
// (inquiry capture, migration-journey display, and the order-summary range calc).
// The label captured at the inquiry step must be a key of FY_END_DATE_MAP, so the
// selector list is derived from the map — the two can never drift.
// Months are 0-indexed to match the JS Date constructor.
export const FY_END_DATE_MAP: Record<string, { month: number; day: number }> = {
  '31st January': { month: 0, day: 31 },
  '28th February': { month: 1, day: 28 },
  '31st March': { month: 2, day: 31 },
  '30th April': { month: 3, day: 30 },
  '31st May': { month: 4, day: 31 },
  '30th June': { month: 5, day: 30 },
  '31st July': { month: 6, day: 31 },
  '31st August': { month: 7, day: 31 },
  '30th September': { month: 8, day: 30 },
  '31st October': { month: 9, day: 31 },
  '30th November': { month: 10, day: 30 },
  '31st December': { month: 11, day: 31 },
};

// Ordered label list (Jan → Dec) for FY-end selectors.
export const FY_ENDS = Object.keys(FY_END_DATE_MAP);

// FY end used when the pair has no country-specific rule to apply.
export const DEFAULT_FY_END = '31st March';

/**
 * Statutory financial-year end per country, keyed by the country labels shown on
 * the inquiry form. Pairs offered in a fixed set of regions (QBO → MYOB, Xero → MYOB)
 * use this to pre-select the FY-end field when the country changes; the full FY_ENDS list
 * stays selectable for entities on a substituted accounting period.
 * Every value must be a key of FY_END_DATE_MAP, or the order-summary range calc
 * (calculateMigrationPeriod) cannot resolve the label it is paired with.
 */
export const COUNTRY_FY_END: Record<string, string> = {
  'Australia (AUD)': '30th June',
  'New Zealand (NZD)': '31st March',
};
