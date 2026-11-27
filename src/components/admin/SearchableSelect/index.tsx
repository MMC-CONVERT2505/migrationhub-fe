import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line, e.g. an email. Also matched by the local search. */
  hint?: string | null;
}

interface Props {
  /** Accessible name, also used for the empty-state wording. */
  label: string;
  /** Text of the "no filter" row and of the closed control when nothing is picked. */
  allLabel: string;
  options: SelectOption[];
  /** The picked option. Kept by the parent so it still shows when the search results no longer contain it. */
  selected: SelectOption | null;
  onSelect: (option: SelectOption | null) => void;
  /** Remote search: called (debounced by the parent) with the typed text. Omit to filter `options` locally. */
  onSearch?: (query: string) => void;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  searchPlaceholder?: string;
  /** Note under the list, e.g. that the results are capped. */
  footnote?: string;
  className?: string;
}

const matches = (o: SelectOption, q: string) => {
  const hay = `${o.label} ${o.hint ?? ''}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};

/** Searchable single-select (ARIA combobox) with an "all" row, keyboard support and remote/local search. */
export const SearchableSelect: React.FC<Props> = ({
  label, allLabel, options, selected, onSelect, onSearch, loading, error, onRetry, searchPlaceholder, footnote, className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();

  const visible = useMemo(
    () => (onSearch || !query.trim() ? options : options.filter((o) => matches(o, query))),
    [options, query, onSearch],
  );
  // Row 0 is always "all"; real options follow.
  const rowCount = visible.length + 1;

  const close = () => { setOpen(false); setQuery(''); onSearch?.(''); };
  const choose = (o: SelectOption | null) => { onSelect(o); close(); };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) close(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // The button can wrap anywhere in a toolbar: pull the panel left if it would run off the screen.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!open || !el) return;
    el.style.marginLeft = '0px';
    const box = el.getBoundingClientRect();
    const over = box.right - (document.documentElement.clientWidth - 8);
    if (over > 0) el.style.marginLeft = `${-Math.min(over, box.left - 8)}px`;
  }, [open]);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  // While searching, highlight the first match (not "all"), so Enter picks what was searched for.
  useEffect(() => {
    setActive((a) => (query.trim() && visible.length ? 1 : Math.min(a, visible.length)));
  }, [query, visible]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % rowCount); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + rowCount) % rowCount); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      // Remote results still on their way, or nothing matched: Enter must not pick a stale row or clear the filter.
      if (query.trim() && ((onSearch && loading) || visible.length === 0)) return;
      choose(active === 0 ? null : visible[active - 1] ?? null);
      trigger.current?.focus();
    }
    else if (e.key === 'Escape') { e.preventDefault(); close(); trigger.current?.focus(); }
    else if (e.key === 'Tab') close();
  };

  return (
    <div ref={root} className={`relative ${className ?? ''}`}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? close() : setOpen(true))}
        className={`flex items-center justify-between gap-2 w-full max-w-[14rem] px-2.5 py-1.5 text-xs rounded-lg border bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          selected ? 'border-blue-400' : 'border-border'
        }`}
      >
        <span className="truncate">{selected ? selected.label : allLabel}</span>
        <svg className="w-3 h-3 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div ref={panel} className="absolute z-30 mt-1 w-72 max-w-[85vw] bg-white border border-border rounded-lg shadow-lg">
          <div className="p-2 border-b border-border">
            <input
              ref={input}
              type="text"
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={`${listId}-${active}`}
              aria-autocomplete="list"
              value={query}
              maxLength={100}
              onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value); }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder ?? 'Search…'}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <ul id={listId} role="listbox" aria-label={label} className="max-h-64 overflow-y-auto py-1">
            <li
              id={`${listId}-0`}
              role="option"
              aria-selected={!selected}
              onMouseEnter={() => setActive(0)}
              onClick={() => choose(null)}
              className={`px-3 py-1.5 text-xs cursor-pointer ${active === 0 ? 'bg-bg-light' : ''} ${!selected ? 'font-semibold' : ''}`}
            >
              {allLabel}
            </li>
            {visible.map((o, i) => (
              <li
                key={o.value}
                id={`${listId}-${i + 1}`}
                role="option"
                aria-selected={selected?.value === o.value}
                onMouseEnter={() => setActive(i + 1)}
                onClick={() => choose(o)}
                className={`px-3 py-1.5 cursor-pointer ${active === i + 1 ? 'bg-bg-light' : ''}`}
              >
                <div className={`text-xs text-text-primary truncate ${selected?.value === o.value ? 'font-semibold' : ''}`}>{o.label}</div>
                {o.hint && <div className="text-[11px] text-text-secondary truncate">{o.hint}</div>}
              </li>
            ))}
            {loading && <li className="px-3 py-2 text-xs text-text-secondary" role="status">Loading…</li>}
            {!loading && error && (
              <li className="px-3 py-2 text-xs text-red-700" role="alert">
                {error}{' '}
                {onRetry && <button type="button" onClick={onRetry} className="underline font-semibold">Retry</button>}
              </li>
            )}
            {!loading && !error && visible.length === 0 && (
              <li className="px-3 py-2 text-xs text-text-secondary">
                {query.trim() ? `No results for “${query.trim()}”` : `No ${label.toLowerCase()} found`}
              </li>
            )}
          </ul>
          {footnote && <p className="px-3 py-2 border-t border-border text-[11px] text-text-secondary">{footnote}</p>}
        </div>
      )}
    </div>
  );
};
