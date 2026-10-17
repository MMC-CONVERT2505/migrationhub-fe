import { describe, expect, it } from 'vitest';
import { groupByModule, moduleOf, worstSeverity } from '../errorLogs';

describe('moduleOf', () => {
  it('takes the part before the first dot', () => {
    expect(moduleOf('customers.push')).toBe('customers');
    expect(moduleOf('invoices.lines.map')).toBe('invoices');
  });
  it('treats an id without a dot as its own module, and blank as unknown', () => {
    expect(moduleOf('auth')).toBe('auth');
    expect(moduleOf('.hidden')).toBe('.hidden');
    expect(moduleOf('  ')).toBe('unknown');
    expect(moduleOf(null)).toBe('unknown');
  });
});

describe('worstSeverity', () => {
  it('picks the highest level that has errors', () => {
    expect(worstSeverity({ WARN: 3, ERROR: 1, CRITICAL: 0 })).toBe('ERROR');
    expect(worstSeverity({ WARN: 0, ERROR: 0, CRITICAL: 2 })).toBe('CRITICAL');
    expect(worstSeverity({ WARN: 0, ERROR: 0, CRITICAL: 0 })).toBeNull();
    expect(worstSeverity({})).toBeNull();
  });
});

describe('groupByModule', () => {
  it('buckets by module in arrival order', () => {
    const out = groupByModule([
      { module: 'a', n: 1 }, { module: 'a', n: 2 }, { module: 'b', n: 3 },
    ]);
    expect(out.map((b) => [b.module, b.items.length])).toEqual([['a', 2], ['b', 1]]);
  });
  it('handles an empty list', () => {
    expect(groupByModule([])).toEqual([]);
  });
});
