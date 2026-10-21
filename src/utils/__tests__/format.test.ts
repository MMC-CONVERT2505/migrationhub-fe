import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../format';

describe('formatCurrency', () => {
  it('never shows decimals', () => {
    expect(formatCurrency(389)).toBe('$389');
    expect(formatCurrency(389.0)).toBe('$389');
    expect(formatCurrency(389.5)).toBe('$390');
    expect(formatCurrency(389.4)).toBe('$389');
    expect(formatCurrency(0)).toBe('$0');
    expect(formatCurrencyCompact(49.99)).toBe('$50');
  });
});
