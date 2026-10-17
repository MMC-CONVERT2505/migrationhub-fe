import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  adminErrorLogsService,
  type ErrorCategory,
  type ErrorFunctionSummary,
  type ErrorGroupStatus,
  type ErrorLogRow,
  type ErrorSeverity,
} from '@/api/adminErrorLogs';
import { ApiError } from '@/api/client';
import { groupByModule, worstSeverity } from '@/utils/errorLogs';
import { ErrorEntry } from './ErrorEntry';
import { Badge, Chevron, SEVERITY_META, ago, countLabel, fmt } from './shared';

export interface ErrorLogFilters {
  /** Tool code, e.g. qbo_to_xero. */
  pair?: string;
  migrationId?: string;
  status?: ErrorGroupStatus;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  search?: string;
}

const PAGE = 10;

const toParams = (f: ErrorLogFilters) => ({
  migration_pair: f.pair || undefined,
  migration_id: f.migrationId || undefined,
  status: f.status,
  category: f.category,
  severity: f.severity,
  search: f.search || undefined,
});

const errMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError
    ? err.statusCode === 403
      ? 'You do not have permission to view error logs.'
      : err.message
    : fallback;

const ErrorBox: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
    <span>{message}</span>
    <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button>
  </div>
);

/** The errors of one function, newest first, loaded on demand and paged. */
const FunctionErrors: React.FC<{
  functionId: string;
  filters: ErrorLogFilters;
  hideMigration: boolean;
}> = ({ functionId, filters, hideMigration }) => {
  const [rows, setRows] = useState<ErrorLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Only the latest request may write state — a slow earlier page must not clobber a newer one.
  const reqId = useRef(0);

  const load = useCallback(
    async (skip: number) => {
      const id = ++reqId.current;
      setLoading(true);
      setError('');
      try {
        const res = await adminErrorLogsService.logs({
          ...toParams(filters),
          function_id: functionId,
          sort: 'recent',
          skip,
          take: PAGE,
        });
        if (id !== reqId.current) return;
        // Appended pages are de-duplicated: a new error arriving between pages shifts the offset.
        setRows((prev) => {
          if (skip === 0) return res.data;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...res.data.filter((r) => !seen.has(r.id))];
        });
        setTotal(res.total);
      } catch (err) {
        if (id === reqId.current) setError(errMessage(err, 'Failed to load errors.'));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [filters, functionId],
  );

  useEffect(() => {
    load(0);
    return () => { reqId.current++; };
  }, [load]);

  return (
    <div className="ml-8 sm:ml-10 mr-3 sm:mr-4 mb-2 space-y-2">
      {error && <ErrorBox message={error} onRetry={() => load(rows.length === 0 ? 0 : rows.length)} />}
      {rows.map((e) => (
        <ErrorEntry key={e.id} entry={e} hideMigration={hideMigration} hideFunction />
      ))}
      {loading && <p role="status" className="text-xs text-text-secondary">Loading…</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-xs text-text-secondary">No errors match these filters.</p>
      )}
      {!loading && rows.length < total && (
        <button
          type="button"
          onClick={() => load(rows.length)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-bg-light"
        >
          Show more ({total - rows.length} left)
        </button>
      )}
    </div>
  );
};

interface ErrorLogBrowserProps {
  filters: ErrorLogFilters;
  /** Reload when this changes (e.g. after a status change elsewhere on the page). */
  refreshKey?: number;
  /** The list is scoped to one migration, so rows needn't link back to it. */
  hideMigration?: boolean;
  /** Shown when nothing matches — lets a page say "no errors for this migration". */
  emptyMessage?: string;
  /** Rendered inside another row (a migration dropdown): indented with a guide line. */
  nested?: boolean;
}

/**
 * Errors organised the way a developer reads them: module → function (the failing "file") →
 * individual errors. Used by the Error Logs page and by each migration's own page.
 */
export const ErrorLogBrowser: React.FC<ErrorLogBrowserProps> = ({
  filters,
  refreshKey = 0,
  hideMigration = false,
  emptyMessage = 'No errors match these filters.',
  nested = false,
}) => {
  const [functions, setFunctions] = useState<ErrorFunctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [openFunctions, setOpenFunctions] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  // A stable identity for the filter values, so equal filters never refetch.
  const filterKey = JSON.stringify(filters);
  const stable = useMemo(() => JSON.parse(filterKey) as ErrorLogFilters, [filterKey]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const res = await adminErrorLogsService.functions(toParams(stable));
      if (id !== reqId.current) return;
      setFunctions(res.data);
      // First module open, so a result is never a wall of closed headings.
      setOpenModules((prev) => (prev.size > 0 ? prev : new Set(res.data.slice(0, 1).map((f) => f.module))));
    } catch (err) {
      if (id !== reqId.current) return;
      setFunctions([]);
      setError(errMessage(err, 'Failed to load error logs.'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [stable]);

  useEffect(() => {
    setOpenModules(new Set());
    setOpenFunctions(new Set());
  }, [filterKey]);

  useEffect(() => {
    load();
    return () => { reqId.current++; };
  }, [load, refreshKey]);

  const modules = useMemo(() => groupByModule(functions), [functions]);

  const toggle = (set: Set<string>, key: string, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (!next.delete(key)) next.add(key);
    apply(next);
  };

  if (loading && functions.length === 0) {
    return <p role="status" className="py-10 text-center text-sm text-text-secondary">Loading…</p>;
  }
  if (error) return <div className="p-4"><ErrorBox message={error} onRetry={load} /></div>;
  if (modules.length === 0) {
    return <p className="py-10 text-center text-sm text-text-secondary">{emptyMessage}</p>;
  }

  return (
    <div
      className={nested ? 'ml-4 sm:ml-6 my-2 mr-3 sm:mr-4 border-l-2 border-border' : ''}
      aria-busy={loading}
    >
      {modules.map((m) => {
        const moduleOpen = openModules.has(m.module);
        const errors = m.items.reduce((n, f) => n + f.errors, 0);
        const sev = worstSeverity(
          m.items.reduce(
            (acc, f) => ({
              WARN: acc.WARN + f.severities.WARN,
              ERROR: acc.ERROR + f.severities.ERROR,
              CRITICAL: acc.CRITICAL + f.severities.CRITICAL,
            }),
            { WARN: 0, ERROR: 0, CRITICAL: 0 },
          ),
        );
        const panelId = `mod-${m.module}`;
        return (
          <section key={m.module} aria-label={`Module ${m.module}`} className="border-b border-border last:border-b-0">
            <h4>
              <button
                type="button"
                aria-expanded={moduleOpen}
                aria-controls={panelId}
                onClick={() => toggle(openModules, m.module, setOpenModules)}
                className="w-full px-3 sm:px-4 py-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-left bg-white hover:bg-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40"
              >
                <Chevron open={moduleOpen} />
                <span className="text-[13px] font-semibold text-text-primary max-w-full break-words">{m.module}</span>
                <span className="text-xs text-text-secondary">
                  {countLabel(errors, 'error')}
                  {m.items.length > 1 ? ` in ${m.items.length} functions` : ''}
                </span>
                {sev && <span className="ml-auto flex-shrink-0"><Badge className={SEVERITY_META[sev]}>{sev}</Badge></span>}
              </button>
            </h4>
            {moduleOpen && (
              <ul id={panelId} className="pb-1.5">
                {m.items.map((f) => {
                  const fnOpen = openFunctions.has(f.functionId);
                  const fnSev = worstSeverity(f.severities);
                  return (
                    <li key={f.functionId}>
                      <button
                        type="button"
                        aria-expanded={fnOpen}
                        onClick={() => toggle(openFunctions, f.functionId, setOpenFunctions)}
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-left hover:bg-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40"
                      >
                        <Chevron open={fnOpen} />
                        <span className="text-xs font-mono text-text-primary break-all">{f.functionId}</span>
                        <span className="text-xs text-text-secondary">{countLabel(f.errors, 'error')}</span>
                        {fnSev && <Badge className={SEVERITY_META[fnSev]}>{fnSev}</Badge>}
                        <span className="ml-auto text-[11px] text-text-secondary" title={fmt(f.lastErrorAt)}>
                          {ago(f.lastErrorAt)}
                        </span>
                      </button>
                      {fnOpen && (
                        <FunctionErrors functionId={f.functionId} filters={stable} hideMigration={hideMigration} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
};
