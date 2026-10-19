import React from 'react';
import { pageCount, pageWindow } from '@/utils/pagination';

interface PaginationProps {
  /** Offset of the first row on the page. */
  skip: number;
  size: number;
  total: number;
  onSkipChange: (skip: number) => void;
  /** Omit to hide the rows-per-page choice. */
  onSizeChange?: (size: number) => void;
  sizes?: number[];
  /** What the rows are called, for the "Showing 1–20 of 51 users" line. */
  noun?: string;
  disabled?: boolean;
}

const btn =
  'min-w-[2rem] px-2.5 py-1 text-xs font-medium border border-border rounded-lg bg-white text-text-primary ' +
  'hover:bg-bg-light disabled:opacity-40 disabled:pointer-events-none transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';

/** Admin list footer: range summary, rows-per-page, and First / Previous / numbered pages / Next / Last. */
export const Pagination: React.FC<PaginationProps> = ({
  skip, size, total, onSkipChange, onSizeChange, sizes = [20, 50, 100], noun = 'items', disabled = false,
}) => {
  if (total <= 0) return null;
  const pages = pageCount(total, size);
  const current = Math.floor(skip / size) + 1;
  const go = (page: number) => onSkipChange((Math.min(Math.max(page, 1), pages) - 1) * size);
  const from = skip + 1;
  const to = Math.min(skip + size, total);

  return (
    <div className="flex flex-col gap-3 px-4 sm:px-5 py-3 border-t border-border bg-bg-light sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs text-text-secondary" aria-live="polite">
          Showing {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()} {noun}
        </p>
        {onSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            Rows per page
            <select
              value={size}
              disabled={disabled}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg border border-border bg-white text-text-primary"
            >
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          <button type="button" className={btn} disabled={disabled || current === 1} onClick={() => go(1)} aria-label="First page">«</button>
          <button type="button" className={btn} disabled={disabled || current === 1} onClick={() => go(current - 1)}>Previous</button>
          {pageWindow(current, pages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-text-secondary" aria-hidden="true">…</span>
            ) : (
              <button
                type="button"
                key={p}
                disabled={disabled}
                onClick={() => go(p)}
                aria-label={`Page ${p}`}
                aria-current={p === current ? 'page' : undefined}
                className={`${btn} ${p === current ? '!bg-blue-600 !text-white !border-blue-600' : ''}`}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={btn} disabled={disabled || current === pages} onClick={() => go(current + 1)}>Next</button>
          <button type="button" className={btn} disabled={disabled || current === pages} onClick={() => go(pages)} aria-label="Last page">»</button>
        </nav>
      )}
    </div>
  );
};
