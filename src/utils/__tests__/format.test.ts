import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../format';

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

describe('formatNumber', () => {
  it('formats numbers and shows a dash for anything that is not a finite number', () => {
    expect(formatNumber(1234)).toBe((1234).toLocaleString());
    for (const bad of [undefined, null, NaN, Infinity]) expect(formatNumber(bad as never)).toBe('—');
  });
});
