import { describe, expect, it } from 'vitest';
import type { CleanerAction, CleanerRow } from '@/api/adminMigrationCleaner';
import { BATCH_SIZE, SELECTION_LIMIT, blockedBy, canRun, chunk, confirmPhrase, needsPhrase, togglePage } from '../cleanerSelection';

const row = (id: string, can: Partial<Record<CleanerAction, boolean>>): CleanerRow => {
  const full = { PURGE: false, SOFT_DELETE: false, HARD_DELETE: false, RESTORE: false, ...can };
  return {
    id,
    can: full,
    blockedBy: Object.fromEntries(Object.entries(full).map(([a, ok]) => [a, ok ? [] : ['no']])),
  } as unknown as CleanerRow;
};

const rows = [
  row('a', { PURGE: true, SOFT_DELETE: true, HARD_DELETE: true }),
  row('b', { PURGE: true, SOFT_DELETE: true }),
  row('c', { RESTORE: true }),
];

describe('canRun', () => {
  it('follows the action', () => {
    expect(canRun(rows[1], 'PURGE')).toBe(true);
    expect(canRun(rows[1], 'HARD_DELETE')).toBe(false);
    expect(canRun(rows[2], 'RESTORE')).toBe(true);
    expect(blockedBy(rows[1], 'HARD_DELETE')).toEqual(['no']);
  });
});

describe('togglePage', () => {
  it('selects every row on the page whatever its status', () => {
    expect([...togglePage(new Set(), rows)].sort()).toEqual(['a', 'b', 'c']);
    expect([...togglePage(new Set(), [row('z', {})])]).toEqual(['z']);
  });
  it('clears the page when it is all selected already, keeping other pages', () => {
    expect([...togglePage(new Set(['a', 'b', 'c', 'other-page']), rows)]).toEqual(['other-page']);
  });
  it('tops up a partly selected page', () => {
    expect([...togglePage(new Set(['a']), rows)].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('chunk', () => {
  it('splits 369 ids into batches the server accepts, losing none', () => {
    const ids = Array.from({ length: 369 }, (_, i) => String(i));
    const parts = chunk(ids);
    expect(parts.map((p) => p.length)).toEqual([200, 169]);
    expect(parts.flat()).toEqual(ids);
    expect(Math.max(...parts.map((p) => p.length))).toBeLessThanOrEqual(BATCH_SIZE);
  });
  it('handles empty and exact multiples', () => {
    expect(chunk([])).toEqual([]);
    expect(chunk(Array.from({ length: 400 }, (_, i) => i)).map((p) => p.length)).toEqual([200, 200]);
  });
  it('lets one selection hold far more than a batch', () => {
    expect(SELECTION_LIMIT).toBeGreaterThanOrEqual(369);
  });
});

describe('force (admin hard delete past the rules)', () => {
  it('makes every row runnable, but only for hard delete', () => {
    expect(canRun(rows[2], 'HARD_DELETE')).toBe(false);
    expect(canRun(rows[2], 'HARD_DELETE', true)).toBe(true);
    expect(canRun(rows[2], 'PURGE', true)).toBe(false);
  });
  it('has its own phrase', () => {
    expect(confirmPhrase('HARD_DELETE', 4, true)).toBe('FORCE HARD DELETE 4');
    expect(confirmPhrase('HARD_DELETE', 4)).toBe('HARD DELETE 4');
  });
});

describe('confirmation', () => {
  it('builds the phrase the server expects', () => {
    expect(confirmPhrase('HARD_DELETE', 12)).toBe('HARD DELETE 12');
    expect(confirmPhrase('SOFT_DELETE', 2)).toBe('SOFT DELETE 2');
    expect(confirmPhrase('PURGE', 1)).toBe('PURGE 1');
    expect(confirmPhrase('RESTORE', 3)).toBe('RESTORE 3');
  });
  it('asks for it only when the action cannot be undone', () => {
    expect(needsPhrase('PURGE')).toBe(true);
    expect(needsPhrase('HARD_DELETE')).toBe(true);
    expect(needsPhrase('SOFT_DELETE')).toBe(false);
    expect(needsPhrase('RESTORE')).toBe(false);
  });
});
