import { describe, expect, it } from 'vitest';
import { countryForDialCode } from '../phone';

const CODES = {
  Australia: '+61', 'New Zealand': '+64', 'United Kingdom': '+44', 'United States': '+1', Canada: '+1',
};
const ALL = Object.keys(CODES);

describe('countryForDialCode', () => {
  it('selects the one country using an unambiguous code', () => {
    expect(countryForDialCode('+44', ALL, 'Australia', CODES)).toBe('United Kingdom');
  });
  it('keeps the current country when it already uses the code (+1 never flips Canada)', () => {
    expect(countryForDialCode('+1', ALL, 'Canada', CODES)).toBeNull();
    expect(countryForDialCode('+61', ALL, 'Australia', CODES)).toBeNull();
  });
  it('picks the first matching country for a shared code', () => {
    expect(countryForDialCode('+1', ALL, 'Australia', CODES)).toBe('United States');
  });
  it('leaves the country alone when no allowed country uses the code (restricted pair)', () => {
    expect(countryForDialCode('+44', ['Australia', 'New Zealand'], 'Australia', CODES)).toBeNull();
  });
  it('switches between allowed countries on a restricted pair', () => {
    expect(countryForDialCode('+64', ['Australia', 'New Zealand'], 'Australia', CODES)).toBe('New Zealand');
  });
  it('ignores an unknown code', () => {
    expect(countryForDialCode('+999', ALL, 'Australia', CODES)).toBeNull();
  });
});
