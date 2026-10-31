import { describe, expect, it } from 'vitest';
import type { CleanerAction, CleanerRow } from '@/api/adminMigrationCleaner';
import { blockedBy, canRun, confirmPhrase, needsPhrase, togglePage } from '../cleanerSelection';

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
  it('selects only the rows the action may run on', () => {
    expect([...togglePage(new Set(), rows, 'PURGE')].sort()).toEqual(['a', 'b']);
    expect([...togglePage(new Set(), rows, 'HARD_DELETE')]).toEqual(['a']);
    expect([...togglePage(new Set(), rows, 'RESTORE')]).toEqual(['c']);
  });
  it('clears them when they are all selected already, keeping other pages', () => {
    expect([...togglePage(new Set(['a', 'b', 'other-page']), rows, 'PURGE')]).toEqual(['other-page']);
  });
  it('does nothing when nothing on the page is allowed', () => {
    expect(togglePage(new Set(['x']), [row('z', {})], 'PURGE').size).toBe(1);
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
