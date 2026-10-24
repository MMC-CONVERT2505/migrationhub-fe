import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminErrorLogsService,
  type ErrorCategory,
  type ErrorGroup,
  type ErrorGroupStatus,
  type ErrorLogEntry,
  type ErrorSeverity,
  type ErrorTool,
} from '@/api/adminErrorLogs';
import { ApiError } from '@/api/client';
import { ErrorLogBrowser } from '@/components/admin/ErrorLogBrowser';
import { MigrationErrorList } from '@/components/admin/ErrorLogBrowser/MigrationErrorList';
import { ErrorEntry } from '@/components/admin/ErrorLogBrowser/ErrorEntry';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip } from '@/utils/pagination';
import {
  Badge, CATEGORY_META, GROUP_STATUS_META, SEVERITY_META, ago, fmt,
} from '@/components/admin/ErrorLogBrowser/shared';

const PAGE_SIZE = 20;

type View = 'cause' | 'module' | 'migration';

const VIEWS: { key: View; label: string }[] = [
  { key: 'cause', label: 'By cause' },
  { key: 'module', label: 'By module' },
  { key: 'migration', label: 'By migration' },
];

/** One plain sentence on what the current view lists and how to use it. */
const VIEW_HINT: Record<View, string> = {
  cause: 'Errors with the same cause are grouped. Click one to see each occurrence.',
  module: 'Errors by module and function. Open a module, then a function.',
  migration: 'One row per migration. Open one to see all of its errors.',
};

const STATUS_TABS: { key: ErrorGroupStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'MUTED', label: 'Muted' },
];

const STATUS_KEYS = new Set<string>(['all', 'OPEN', 'RESOLVED', 'MUTED']);

const Select: React.FC<{
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}> = ({ value, onChange, label, children }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
    className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
  >
    {children}
  </select>
);

/** Errors inside one cause (group), with the raw exception behind a click. */
const GroupErrors: React.FC<{ group: ErrorGroup; migrationId?: string }> = ({ group, migrationId }) => {
  const [rows, setRows] = useState<ErrorLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reqId = useRef(0);

  const load = useCallback(
    async (skip: number) => {
      const id = ++reqId.current;
      setLoading(true);
      setError('');
      try {
        const res = await adminErrorLogsService.groupErrors(group.id, {
          skip,
          take: 10,
          migration_id: migrationId || undefined,
        });
        if (id !== reqId.current) return;
        setRows((prev) => {
          if (skip === 0) return res.data;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...res.data.filter((r) => !seen.has(r.id))];
        });
        setTotal(res.total);
      } catch (err) {
        if (id === reqId.current) setError(err instanceof ApiError ? err.message : 'Failed to load errors.');
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [group.id, migrationId],
  );

  useEffect(() => {
    load(0);
    return () => { reqId.current++; };
  }, [load]);

  return (
    <div className="bg-bg-light border-t border-border px-3 sm:px-4 py-3">
      {error && <p role="alert" className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {rows.map((e) => <ErrorEntry key={e.id} entry={e} />)}
        {!loading && rows.length === 0 && !error && (
          <p className="text-xs text-text-secondary">No errors in this group.</p>
        )}
      </div>
      {loading && <p role="status" className="text-xs text-text-secondary mt-2">Loading…</p>}
      {!loading && rows.length < total && (
        <button
          type="button"
          onClick={() => load(rows.length)}
          className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-bg-light"
        >
          Show more ({total - rows.length} left)
        </button>
      )}
    </div>
  );
};

const ErrorLogsPage: React.FC = () => {
  // Filters live in the URL, so a link from a migration (or a refresh) lands on the same view.
  const [params, setParams] = useSearchParams();
  // A migration filter defaults to the module view (its errors read best by function), but the
  // toggle always wins once chosen.
  const viewParam = params.get('view');
  const view: View =
    viewParam === 'module' || viewParam === 'cause' || viewParam === 'migration'
      ? viewParam
      : params.get('migration') ? 'module' : 'cause';
  const tool = params.get('tool') ?? '';
  const migrationId = (params.get('migration') ?? '').trim();
  const rawStatus = params.get('status') ?? 'OPEN';
  const status = (STATUS_KEYS.has(rawStatus) ? rawStatus : 'OPEN') as ErrorGroupStatus | 'all';

  const setParam = useCallback(
    (key: string, value: string) =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          if (value) next.set(key, value); else next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  const setView = (v: View) => setParam('view', v);
  const setTool = (v: string) => setParam('tool', v);
  const setStatus = (v: ErrorGroupStatus | 'all') => setParam('status', v === 'OPEN' ? '' : v);

  const [tools, setTools] = useState<ErrorTool[]>([]);
  const [category, setCategory] = useState<ErrorCategory | ''>('');
  const [severity, setSeverity] = useState<ErrorSeverity | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [migrationInput, setMigrationInput] = useState(migrationId);
  const [skip, setSkip] = useState(0);

  const [rows, setRows] = useState<ErrorGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const reqId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // The migration box edits locally; it is applied to the URL after a pause, so typing an id
  // doesn't fire a request per keystroke. Back/forward or a link keeps the box in step.
  useEffect(() => { setMigrationInput(migrationId); }, [migrationId]);
  useEffect(() => {
    const t = setTimeout(() => {
      const v = migrationInput.trim();
      if (v !== migrationId) setParam('migration', v);
    }, 400);
    return () => clearTimeout(t);
  }, [migrationInput, migrationId, setParam]);

  useEffect(() => { setSkip(0); setExpanded(null); }, [tool, status, category, severity, debouncedSearch, migrationId]);

  const loadTools = useCallback(() => {
    // A malformed reply must not blank the page: only an array is a usable tool list.
    adminErrorLogsService.tools().then((t) => setTools(Array.isArray(t) ? t : [])).catch(() => setTools([]));
  }, []);
  useEffect(() => { loadTools(); }, [loadTools]);

  const load = useCallback(async () => {
    if (view !== 'cause') return;
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const res = await adminErrorLogsService.groups({
        migration_pair: tool || undefined,
        status: status === 'all' ? undefined : status,
        category: category || undefined,
        severity: severity || undefined,
        search: debouncedSearch || undefined,
        migration_id: migrationId || undefined,
        skip,
        take: PAGE_SIZE,
      });
      if (id !== reqId.current) return;
      setRows(res.data);
      setTotal(res.total);
      // The list can shrink under us: never sit on a page past the end.
      const safeSkip = clampSkip(skip, res.total, PAGE_SIZE);
      if (safeSkip !== skip) setSkip(safeSkip);
    } catch (err) {
      if (id !== reqId.current) return;
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load error logs.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [view, tool, status, category, severity, debouncedSearch, migrationId, skip]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (g: ErrorGroup, next: ErrorGroupStatus) => {
    setBusy(g.id);
    try {
      await adminErrorLogsService.setGroupStatus(g.id, next);
      loadTools();
      setRefreshKey((k) => k + 1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the group.');
    } finally {
      setBusy(null);
    }
  };

  const totals = useMemo(
    () => ({
      errors: tools.reduce((n, t) => n + t.errors, 0),
      open: tools.reduce((n, t) => n + t.openGroups, 0),
    }),
    [tools],
  );

  const browserFilters = useMemo(
    () => ({
      pair: tool || undefined,
      migrationId: migrationId || undefined,
      status: status === 'all' ? undefined : status,
      category: category || undefined,
      severity: severity || undefined,
      search: debouncedSearch || undefined,
    }),
    [tool, migrationId, status, category, severity, debouncedSearch],
  );

  const filtersActive = !!(tool || migrationId || category || severity || debouncedSearch || status !== 'OPEN');
  const clearFilters = () => {
    setParams(new URLSearchParams({ view }), { replace: true });
    setCategory(''); setSeverity(''); setSearch(''); setMigrationInput('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Error Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Errors reported by the migration tools — see them by cause, by module or by migration
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Tool summary — click to filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setTool('')}
          aria-pressed={tool === ''}
          className={`text-left p-3 rounded-xl border transition-colors ${
            tool === '' ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:bg-bg-light'
          }`}
        >
          <p className="text-xs font-semibold text-text-secondary">All tools</p>
          <p className="text-lg font-bold text-text-primary">{totals.errors.toLocaleString()}</p>
          <p className="text-[11px] text-text-secondary">{totals.open} open groups</p>
        </button>
        {tools.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setTool(t.code)}
            aria-pressed={tool === t.code}
            className={`text-left p-3 rounded-xl border transition-colors ${
              tool === t.code ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:bg-bg-light'
            }`}
          >
            <p className="text-xs font-semibold text-text-secondary font-mono truncate" title={t.displayName}>{t.code}</p>
            <p className="text-lg font-bold text-text-primary">{t.errors.toLocaleString()}</p>
            <p className="text-[11px] text-text-secondary">
              {t.openGroups} open · {t.lastErrorAt ? ago(t.lastErrorAt) : 'no errors'}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {/* View tabs, with what each one shows */}
        <div className="px-4 sm:px-5 pt-3 border-b border-border">
          <div role="group" aria-label="Group errors by" className="flex flex-wrap gap-x-1 -mb-px">
            {VIEWS.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => setView(key)}
                aria-pressed={view === key}
                className={`px-3 sm:px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  view === key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 sm:px-5 py-3 border-b border-border bg-bg-light space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_repeat(3,minmax(0,0.9fr))] gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message, function or code"
              aria-label="Search errors"
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <input
              type="text"
              inputMode="numeric"
              value={migrationInput}
              onChange={(e) => setMigrationInput(e.target.value)}
              placeholder="Migration ID"
              aria-label={view === 'migration' ? 'Find migration by ID' : 'Filter by migration ID'}
              maxLength={64}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
            <Select value={tool} onChange={setTool} label="Filter by tool">
              <option value="">All tools</option>
              {tools.map((t) => (
                <option key={t.id} value={t.code}>{t.code}</option>
              ))}
            </Select>
            <Select value={category} onChange={(v) => setCategory(v as ErrorCategory | '')} label="Filter by category">
              <option value="">All categories</option>
              {(['DATA', 'API', 'AUTH', 'TECH', 'INFRA'] as ErrorCategory[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={severity} onChange={(v) => setSeverity(v as ErrorSeverity | '')} label="Filter by severity">
              <option value="">All severities</option>
              {(['WARN', 'ERROR', 'CRITICAL'] as ErrorSeverity[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-text-secondary mr-1">Status</span>
              {STATUS_TABS.map((t) => (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setStatus(t.key)}
                  aria-pressed={status === t.key}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    status === t.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="text-xs font-semibold text-blue-600 hover:underline">
                Clear filters
              </button>
            )}
            <p className="text-xs text-text-secondary sm:ml-auto" aria-live="polite">
              {VIEW_HINT[view]}
              {migrationId && view === 'migration' && <> Showing ids starting with “{migrationId}”.</>}
              {migrationId && view !== 'migration' && (
                <>
                  {' '}Migration{' '}
                  <Link to={`/admin/migrations/${encodeURIComponent(migrationId)}`} className="text-blue-600 hover:underline">
                    {migrationId}
                  </Link>
                  .
                </>
              )}
              {view === 'cause' && total > 0 && <> {total} {total === 1 ? 'group' : 'groups'}.</>}
            </p>
          </div>
        </div>

        {view === 'migration' ? (
          <MigrationErrorList
            filters={{
              pair: tool || undefined,
              status: status === 'all' ? undefined : status,
              category: category || undefined,
              severity: severity || undefined,
              search: debouncedSearch || undefined,
            }}
            migrationPrefix={migrationId}
            refreshKey={refreshKey}
          />
        ) : view === 'module' ? (
          <ErrorLogBrowser
            filters={browserFilters}
            refreshKey={refreshKey}
            hideMigration={!!migrationId}
            emptyMessage={
              migrationId
                ? `No errors were reported for migration ${migrationId} with these filters.`
                : 'No errors match these filters.'
            }
          />
        ) : (
          <>
            <div className="admin-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Tool', 'Error', 'Function', 'Type', 'Count', 'Last seen', 'Status', ''].map((h, i) => (
                      <th key={h || i} scope="col" className="relative text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                        {h || <span className="sr-only">Actions</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-sm text-text-secondary">Loading…</td></tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-sm text-text-secondary">
                        {migrationId ? `No errors for migration ${migrationId}.` : 'No errors match these filters.'}
                      </td>
                    </tr>
                  ) : (
                    rows.map((g) => {
                      const meta = GROUP_STATUS_META[g.status];
                      const isOpen = expanded === g.id;
                      return (
                        <React.Fragment key={g.id}>
                          <tr className="border-b border-border hover:bg-bg-light">
                            <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                              {g.migrationPair?.code ?? '—'}
                            </td>
                            <td className="px-4 py-3 max-w-[420px]">
                              <button
                                type="button"
                                onClick={() => setExpanded(isOpen ? null : g.id)}
                                aria-expanded={isOpen}
                                className="text-left w-full rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                              >
                                <span className="block text-xs text-text-primary line-clamp-2 break-words" title={g.sampleMessage}>
                                  {g.sampleMessage}
                                </span>
                                {g.latest?.errorCode && (
                                  <span className="block text-[11px] text-text-secondary font-mono mt-0.5">{g.latest.errorCode}</span>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                              {g.latest?.functionId ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {g.latest ? (
                                <div className="flex items-center gap-1.5">
                                  <Badge className={SEVERITY_META[g.latest.severity]}>{g.latest.severity}</Badge>
                                  <Badge className={CATEGORY_META[g.latest.category]}>{g.latest.category}</Badge>
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-text-primary">{g.occurrenceCount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap" title={fmt(g.lastSeenAt)}>
                              {ago(g.lastSeenAt)}
                              <span className="block text-[11px]">first {ago(g.firstSeenAt)}</span>
                            </td>
                            <td className="px-4 py-3"><Badge className={meta.className}>{meta.label}</Badge></td>
                            <td className="px-4 py-3 text-right">
                              <select
                                value=""
                                disabled={busy === g.id}
                                onChange={(e) => e.target.value && changeStatus(g, e.target.value as ErrorGroupStatus)}
                                aria-label={`Change status of ${g.sampleMessage.slice(0, 40)}`}
                                className="px-2 py-1 text-xs rounded-md border border-border bg-white"
                              >
                                <option value="">Mark as…</option>
                                {(['OPEN', 'RESOLVED', 'MUTED'] as ErrorGroupStatus[])
                                  .filter((s) => s !== g.status)
                                  .map((s) => (
                                    <option key={s} value={s}>{GROUP_STATUS_META[s].label}</option>
                                  ))}
                              </select>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr>
                              <td colSpan={8} className="p-0">
                                <GroupErrors group={g} migrationId={migrationId || undefined} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination skip={skip} size={PAGE_SIZE} total={total} noun="error logs" disabled={loading} onSkipChange={setSkip} />
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorLogsPage;
