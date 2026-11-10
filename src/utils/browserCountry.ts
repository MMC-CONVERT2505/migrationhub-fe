import { COUNTRY_NAMES, type CountryName } from '@/constants/countries';

const TIMEZONE_COUNTRIES: Record<string, CountryName> = {
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  'Europe/London': 'United Kingdom',
  'America/New_York': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Chicago': 'United States',
  'America/Toronto': 'Canada',
  'Asia/Singapore': 'Singapore',
  'Asia/Kolkata': 'India',
  'Asia/Dubai': 'United Arab Emirates',
  'Africa/Johannesburg': 'South Africa',
};

const REGION_COUNTRIES: Record<string, CountryName> = {
  AU: 'Australia',
  NZ: 'New Zealand',
  GB: 'United Kingdom',
  US: 'United States',
  CA: 'Canada',
  SG: 'Singapore',
  IN: 'India',
  AE: 'United Arab Emirates',
  ZA: 'South Africa',
};

/** Uses browser-provided locale/timezone hints only; it never sends the visitor's data elsewhere. */
export function browserCountry(): CountryName | null {
  if (typeof navigator === 'undefined') return null;

  const locale = navigator.language || '';
  const region = locale.match(/[-_]([A-Z]{2})$/i)?.[1]?.toUpperCase();
  if (region && REGION_COUNTRIES[region]) return REGION_COUNTRIES[region];

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_COUNTRIES[timezone] ?? null;
}

export function isPricedCountry(value: string | null | undefined): value is CountryName {
  return COUNTRY_NAMES.includes(value as CountryName);
}
