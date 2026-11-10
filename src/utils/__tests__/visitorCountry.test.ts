import { describe, expect, it } from 'vitest';
import { countryFromSignals } from '../visitorCountry';
import { COUNTRY_NAMES } from '@/constants/countries';

describe('countryFromSignals: time zone', () => {
  it.each([
    ['Asia/Kolkata', 'India'],
    ['Asia/Calcutta', 'India'],
    ['Australia/Melbourne', 'Australia'],
    ['Australia/Perth', 'Australia'],
    ['Pacific/Auckland', 'New Zealand'],
    ['Europe/London', 'United Kingdom'],
    ['Asia/Singapore', 'Singapore'],
    ['Asia/Dubai', 'United Arab Emirates'],
    ['Africa/Johannesburg', 'South Africa'],
    ['America/Toronto', 'Canada'],
    ['America/Vancouver', 'Canada'],
    ['America/Halifax', 'Canada'],
    ['America/New_York', 'United States'],
    ['America/Chicago', 'United States'],
    ['America/Los_Angeles', 'United States'],
    ['America/Indiana/Indianapolis', 'United States'],
    ['Pacific/Honolulu', 'United States'],
  ])('%s -> %s', (tz, want) => expect(countryFromSignals(tz, [])).toBe(want));

  it('only ever names a country the price list sells in', () => {
    for (const tz of ['Asia/Kolkata', 'Australia/Sydney', 'America/Toronto', 'America/Denver', 'Europe/London']) {
      expect(COUNTRY_NAMES).toContain(countryFromSignals(tz, []));
    }
  });

  it('knows nothing about a country we do not sell in (the caller keeps its default)', () => {
    for (const tz of ['Europe/Paris', 'Asia/Tokyo', 'America/Sao_Paulo', 'Africa/Lagos', 'Asia/Karachi', 'UTC', 'Etc/UTC', '']) {
      expect(countryFromSignals(tz, [])).toBeNull();
    }
  });

  it('is not fooled by a similar-looking name', () => {
    expect(countryFromSignals('Asia/Kolkata2', [])).toBeNull();
    expect(countryFromSignals('Europe/Londonderry', [])).toBeNull();
    expect(countryFromSignals('America/Torontoo', [])).toBeNull();
  });
});

describe('countryFromSignals: language fallback', () => {
  it('uses the language region only when the time zone says nothing', () => {
    expect(countryFromSignals('UTC', ['en-IN'])).toBe('India');
    expect(countryFromSignals(null, ['en-AU', 'en'])).toBe('Australia');
    expect(countryFromSignals(undefined, ['fr-FR', 'en-GB'])).toBe('United Kingdom');
    expect(countryFromSignals('', ['en_ZA'])).toBe('South Africa');
  });
  it('the time zone wins over a conflicting language (an Indian user with a US-English browser)', () => {
    expect(countryFromSignals('Asia/Kolkata', ['en-US'])).toBe('India');
  });
  it('ignores a language with no region or an unsold one', () => {
    expect(countryFromSignals('UTC', ['en'])).toBeNull();
    expect(countryFromSignals('UTC', ['fr-FR', 'de-DE'])).toBeNull();
    expect(countryFromSignals(null, [])).toBeNull();
  });
});
