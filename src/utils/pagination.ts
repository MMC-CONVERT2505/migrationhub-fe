/** Rows and total from a list response, whichever shape the endpoint uses. */
export interface ListPage<T> {
  rows: T[];
  total: number;
}

/**
 * Admin list endpoints don't agree on a shape: users returns `{ count, skip, take, data: [] }`,
 * others `{ data: [], total }` or `{ data: { items, total } }`. Reading `.total` alone made the
 * Users page see 0 users in total and hide its pager. This accepts all of them, and never
 * reports fewer rows than it was actually given.
 */
export function parseListResponse<T>(res: unknown): ListPage<T> {
  const body = (res ?? {}) as Record<string, any>;
  const inner = body.data;
  const rows: T[] = Array.isArray(body) ? body
    : Array.isArray(inner) ? inner
    : Array.isArray(inner?.items) ? inner.items
    : Array.isArray(body.items) ? body.items
    : [];
  const reported = [body.total, body.count, inner?.total, inner?.count].find((n) => typeof n === 'number' && n >= 0);
  return { rows, total: Math.max(reported ?? rows.length, rows.length) };
}

export const pageCount = (total: number, size: number): number => (total > 0 ? Math.ceil(total / size) : 0);

/** The offset of the last page, or 0 when empty — keeps a stale `skip` from landing past the end. */
export const clampSkip = (skip: number, total: number, size: number): number => {
  const pages = pageCount(total, size);
  return pages === 0 ? 0 : Math.min(Math.max(0, skip), (pages - 1) * size);
};

export type PageItem = number | 'gap';

/** Page numbers to show: first, last, and a window around the current page, with gaps between. */
export function pageWindow(current: number, pages: number, around = 1): PageItem[] {
  if (pages <= 0) return [];
  const wanted = new Set([1, pages]);
  for (let p = current - around; p <= current + around; p++) if (p >= 1 && p <= pages) wanted.add(p);
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: PageItem[] = [];
  sorted.forEach((p, i) => {
    if (i > 0) {
      const gap = p - sorted[i - 1];
      if (gap === 2) out.push(p - 1); // a single hidden page: show it rather than "…"
      else if (gap > 2) out.push('gap');
    }
    out.push(p);
  });
  return out;
}
