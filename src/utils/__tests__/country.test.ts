import { describe, expect, it } from 'vitest';
import { countryDisplayName } from '../country';

describe('countryDisplayName', () => {
  it('drops the trailing currency code', () => {
    expect(countryDisplayName('Australia (AUD)')).toBe('Australia');
    expect(countryDisplayName('United Arab Emirates (AED)')).toBe('United Arab Emirates');
    expect(countryDisplayName('United States (USD)')).toBe('United States');
  });
  it('leaves names without one alone, and never empties a label', () => {
    expect(countryDisplayName('Australia')).toBe('Australia');
    expect(countryDisplayName('Côte d’Ivoire (XOF)')).toBe('Côte d’Ivoire');
    expect(countryDisplayName('')).toBe('');
  });
});
