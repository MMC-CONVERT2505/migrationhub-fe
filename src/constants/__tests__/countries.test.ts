import { describe, expect, it } from 'vitest';
import { COUNTRIES, COUNTRY_LABELS, COUNTRY_NAMES, DIAL_CODE_BY_LABEL, DIAL_CODE_BY_NAME } from '../countries';
import { PRICED_COUNTRIES } from '@/utils/countryPricing';

describe('shared country list', () => {
  it('names the UAE in full everywhere', () => {
    expect(COUNTRY_NAMES).toContain('United Arab Emirates');
    expect(COUNTRY_NAMES).not.toContain('UAE' as never);
  });

  it('is the price list order', () => {
    expect([...PRICED_COUNTRIES]).toEqual([...COUNTRY_NAMES]);
  });

  it('keeps the wizard labels and dial codes the flow relies on', () => {
    expect(COUNTRY_LABELS).toEqual([
      'Australia (AUD)', 'New Zealand (NZD)', 'United Kingdom (GBP)', 'United States (USD)', 'Canada (CAD)',
      'Singapore (SGD)', 'India (INR)', 'United Arab Emirates (AED)', 'South Africa (ZAR)',
    ]);
    expect(DIAL_CODE_BY_LABEL['United Arab Emirates (AED)']).toBe('+971');
    expect(DIAL_CODE_BY_NAME['Canada']).toBe('+1');
    expect(Object.keys(DIAL_CODE_BY_NAME)).toHaveLength(COUNTRIES.length);
  });
});
