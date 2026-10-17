import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminErrorLogsService, type ErrorMigrationSummary } from '@/api/adminErrorLogs';
import { ApiError } from '@/api/client';
import { statusMeta } from '@/constants/migrationStatus';
import { worstSeverity } from '@/utils/errorLogs';
import { ErrorLogBrowser, type ErrorLogFilters } from './index';
import { Badge, Chevron, SEVERITY_META, ago, countLabel, fmt } from './shared';

const PAGE = 20;

interface MigrationErrorListProps {
  /** Tool / status / category / severity / search — applied to every migration's errors. */
  filters: Omit<ErrorLogFilters, 'migrationId'>;
  /** Start of a migration id; narrows which migrations are listed. */
  migrationPrefix?: string;
  refreshKey?: number;
}

/**
 * "By migration": every migration that has errors, newest first. Each row is a dropdown that
 * opens onto that migration's own errors (module → function → error).
 */
export const MigrationErrorList: React.FC<MigrationErrorListProps> = ({
  filters,
  migrationPrefix = '',
  refreshKey = 0,
}) => {
  const [rows, setRows] = useState<ErrorMigrationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  const filterKey = JSON.stringify({ filters, migrationPrefix });
  const stable = useMemo(
    () => JSON.parse(filterKey) as { filters: typeof filters; migrationPrefix: string },
    [filterKey],
  );

  const load = useCallback(
    async (skip: number) => {
      const id = ++reqId.current;
      setLoading(true);
      setError('');
      try {
        const res = await adminErrorLogsService.migrations({
          migration_pair: stable.filters.pair || undefined,
          migration_id: stable.migrationPrefix || undefined,
          status: stable.filters.status,
          category: stable.filters.category,
          severity: stable.filters.severity,
          search: stable.filters.search || undefined,
          skip,
          take: PAGE,
        });
        if (id !== reqId.current) return;
        // New errors can reorder migrations between pages, so appended rows are de-duplicated.
        setRows((prev) => {
          if (skip === 0) return res.data;
          const seen = new Set(prev.map((r) => r.migrationId));
          return [...prev, ...res.data.filter((r) => !seen.has(r.migrationId))];
        });
        setTotal(res.total);
      } catch (err) {
        if (id !== reqId.current) return;
        if (skip === 0) setRows([]);
        setError(
          err instanceof ApiError
            ? err.statusCode === 403
              ? 'You do not have permission to view error logs.'
              : err.message
            : 'Failed to load migrations.',
        );
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [stable],
  );

  useEffect(() => { setOpen(new Set()); }, [filterKey]);
  useEffect(() => {
    load(0);
    return () => { reqId.current++; };
  }, [load, refreshKey]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  if (loading && rows.length === 0) {
    return <p role="status" className="py-10 text-center text-sm text-text-secondary">Loading…</p>;
  }
  if (error && rows.length === 0) {
    return (
      <div className="p-4">
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => load(0)} className="font-semibold underline">Retry</button>
        </div>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-text-secondary">
        {migrationPrefix
          ? `No migrations starting with “${migrationPrefix}” have errors with these filters.`
          : 'No migrations have errors with these filters.'}
      </p>
    );
  }

  return (
    <div>
      <p className="px-4 sm:px-5 py-2.5 text-xs text-text-secondary border-b border-border" aria-live="polite">
        {countLabel(total, 'migration')} with errors
      </p>
      <ul className="divide-y divide-border">
        {rows.map((m) => {
          const isOpen = open.has(m.migrationId);
          const sev = worstSeverity(m.severities);
          const hub = m.hubStatus ? statusMeta(m.hubStatus as Parameters<typeof statusMeta>[0]) : null;
          const panelId = `mig-${m.migrationId}`;
          // One tool is the normal case; a shared id can span several, so show the first and count the rest.
          const tools = m.pairCodes.length > 1
            ? `${m.pairCodes[0]} +${m.pairCodes.length - 1} more`
            : m.pairCodes[0];
          return (
            <li key={m.migrationId} className={isOpen ? 'bg-bg-light/60' : ''}>
              <div className="flex items-center">
                <h3 className="flex-1 min-w-0">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(m.migrationId)}
                    className="w-full px-4 sm:px-5 py-3.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-left hover:bg-bg-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/40"
                  >
                    <Chevron open={isOpen} />
                    <span className="text-sm font-bold text-text-primary">Migration {m.migrationId}</span>
                    {hub && <Badge className={hub.className}>{hub.label}</Badge>}
                    {m.unmatched && (
                      <span className="text-[11px] text-amber-700" title="No migration in the hub has this id">⚠ not in hub</span>
                    )}
                    <span className="text-xs text-text-secondary">{countLabel(m.errors, 'error')}</span>
                    {sev && <Badge className={SEVERITY_META[sev]}>{sev}</Badge>}
                    {tools && (
                      <span
                        className="text-xs text-text-secondary"
                        title={m.pairCodes.join(', ')}
                      >
                        {tools}
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-text-secondary" title={fmt(m.lastErrorAt)}>
                      {ago(m.lastErrorAt)}
                    </span>
                  </button>
                </h3>
                {!m.unmatched && (
                  <Link
                    to={`/admin/migrations/${encodeURIComponent(m.migrationId)}`}
                    aria-label={`Open migration ${m.migrationId}`}
                    className="px-3 sm:px-4 py-3.5 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap"
                  >
                    Open →
                  </Link>
                )}
              </div>
              {isOpen && (
                <div id={panelId} className="pb-2">
                  <ErrorLogBrowser
                    filters={{ ...stable.filters, migrationId: m.migrationId }}
                    refreshKey={refreshKey}
                    hideMigration
                    nested
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="px-5 py-2 text-xs text-red-700">{error}</p>
      )}
      {rows.length < total && (
        <div className="px-5 py-3 border-t border-border">
          <button
            type="button"
            disabled={loading}
            onClick={() => load(rows.length)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-bg-light disabled:opacity-50"
          >
            {loading ? 'Loading…' : `Show more migrations (${total - rows.length} left)`}
          </button>
        </div>
      )}
    </div>
  );
};
