import type { ErrorSeverity } from '@/api/adminErrorLogs';

/** The module of a tool function: its id up to the first dot (`customers.push` → `customers`).
 *  Mirrors the backend's `moduleOf`, so a module reads the same in both. */
export const moduleOf = (functionId: string | null | undefined): string => {
  const id = (functionId ?? '').trim();
  if (!id) return 'unknown';
  const dot = id.indexOf('.');
  return dot > 0 ? id.slice(0, dot) : id;
};

const SEVERITY_RANK: Record<ErrorSeverity, number> = { WARN: 1, ERROR: 2, CRITICAL: 3 };

/** The most severe level present in a count map, or null when there are no errors. */
export const worstSeverity = (counts: Partial<Record<ErrorSeverity, number>>): ErrorSeverity | null =>
  (Object.keys(SEVERITY_RANK) as ErrorSeverity[])
    .filter((s) => (counts[s] ?? 0) > 0)
    .sort((a, b) => SEVERITY_RANK[b] - SEVERITY_RANK[a])[0] ?? null;

export interface ModuleBucket<T extends { module: string }> {
  module: string;
  items: T[];
}

/** Buckets items by module, keeping the order they arrive in (the API sorts module → function). */
export function groupByModule<T extends { module: string }>(items: readonly T[]): ModuleBucket<T>[] {
  const buckets = new Map<string, ModuleBucket<T>>();
  for (const item of items) {
    const b = buckets.get(item.module) ?? { module: item.module, items: [] };
    b.items.push(item);
    buckets.set(item.module, b);
  }
  return [...buckets.values()];
}
