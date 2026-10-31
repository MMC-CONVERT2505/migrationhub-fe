import type { CleanerAction, CleanerRow } from '@/api/adminMigrationCleaner';

/** Whether the server will allow `action` on this row right now (it re-checks before changing anything). */
export const canRun = (row: CleanerRow, action: CleanerAction, force = false): boolean =>
  force && action === 'HARD_DELETE' ? true : row.can[action];

export const blockedBy = (row: CleanerRow, action: CleanerAction): string[] => row.blockedBy[action];

/** Selection after the page is toggled: only rows the action may run on are ever added. */
export function togglePage(
  selected: ReadonlySet<string>,
  rows: CleanerRow[],
  action: CleanerAction,
  force = false,
): Set<string> {
  const eligible = rows.filter((r) => canRun(r, action, force)).map((r) => r.id);
  const next = new Set(selected);
  const allIn = eligible.length > 0 && eligible.every((id) => next.has(id));
  for (const id of eligible) allIn ? next.delete(id) : next.add(id);
  return next;
}

const VERB: Record<CleanerAction, string> = {
  PURGE: 'PURGE',
  SOFT_DELETE: 'SOFT DELETE',
  HARD_DELETE: 'HARD DELETE',
  RESTORE: 'RESTORE',
};

/** What to type to confirm: the verb and how many, exactly as the server expects. */
export const confirmPhrase = (action: CleanerAction, count: number, force = false): string =>
  `${force ? 'FORCE ' : ''}${VERB[action]} ${count}`;

/** Only what cannot be undone makes the admin type the phrase. */
export const needsPhrase = (action: CleanerAction): boolean => action === 'PURGE' || action === 'HARD_DELETE';

/** Most a single selection may hold (the server caps "select all" at the same number). */
export const SELECTION_LIMIT = 5000;

/** Most ids one request carries; bigger selections are sent as several requests. */
export const BATCH_SIZE = 200;

export function chunk<T>(items: readonly T[], size = BATCH_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
