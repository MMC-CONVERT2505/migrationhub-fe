/** The one list of countries we sell in: names key the price list; `code` is the local currency shown in form labels. */
export const COUNTRIES = [
  { name: 'Australia', code: 'AUD', dial: '+61' },
  { name: 'New Zealand', code: 'NZD', dial: '+64' },
  { name: 'United Kingdom', code: 'GBP', dial: '+44' },
  { name: 'United States', code: 'USD', dial: '+1' },
  { name: 'Canada', code: 'CAD', dial: '+1' },
  { name: 'Singapore', code: 'SGD', dial: '+65' },
  { name: 'India', code: 'INR', dial: '+91' },
  { name: 'United Arab Emirates', code: 'AED', dial: '+971' },
  { name: 'South Africa', code: 'ZAR', dial: '+27' },
] as const;

export type CountryName = (typeof COUNTRIES)[number]['name'];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name) as readonly CountryName[];

/** The wizard's selector label, e.g. "Australia (AUD)". */
export const countryLabel = (c: (typeof COUNTRIES)[number]): string => `${c.name} (${c.code})`;

export const COUNTRY_LABELS: string[] = COUNTRIES.map(countryLabel);

/** Dial code by plain country name. */
export const DIAL_CODE_BY_NAME: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.name, c.dial]));

/** Dial code by wizard label. */
export const DIAL_CODE_BY_LABEL: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [countryLabel(c), c.dial]));
