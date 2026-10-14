import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminErrorLogsService,
  type ErrorCategory,
  type ErrorGroup,
  type ErrorGroupStatus,
  type ErrorLogDetail,
  type ErrorLogEntry,
  type ErrorSeverity,
  type ErrorTool,
} from '@/api/adminErrorLogs';
import { ApiError } from '@/api/client';

const PAGE_SIZE = 20;

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ago = (d?: string | null) => {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SEVERITY_META: Record<ErrorSeverity, string> = {
  WARN: 'bg-amber-50 text-amber-700',
  ERROR: 'bg-red-50 text-red-700',
  CRITICAL: 'bg-red-600 text-white',
};

const CATEGORY_META: Record<ErrorCategory, string> = {
  DATA: 'bg-blue-50 text-blue-700',
  API: 'bg-purple-50 text-purple-700',
  AUTH: 'bg-orange-50 text-orange-700',
  TECH: 'bg-gray-100 text-text-secondary',
  INFRA: 'bg-teal-50 text-teal-700',
};

const GROUP_STATUS_META: Record<ErrorGroupStatus, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-red-50 text-red-700' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-50 text-green-700' },
  MUTED: { label: 'Muted', className: 'bg-gray-100 text-text-secondary' },
};

const STATUS_TABS: { key: ErrorGroupStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'MUTED', label: 'Muted' },
];

const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${className}`}>
    {children}
  </span>
);

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

/** Errors inside one group, with the raw exception behind a click. */
const GroupErrors: React.FC<{ group: ErrorGroup }> = ({ group }) => {
  const [rows, setRows] = useState<ErrorLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
  const [detailError, setDetailError] = useState('');

  const load = useCallback(
    async (skip: number) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminErrorLogsService.groupErrors(group.id, { skip, take: 10 });
        setRows((prev) => (skip === 0 ? res.data : [...prev, ...res.data]));
        setTotal(res.total);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load errors.');
      } finally {
        setLoading(false);
      }
    },
    [group.id],
  );

  useEffect(() => { load(0); }, [load]);

  const toggle = async (id: string) => {
    if (open === id) {
      setOpen(null);
      return;
    }
    setOpen(id);
    setDetail(null);
    setDetailError('');
    try {
      setDetail(await adminErrorLogsService.detail(id));
    } catch (err) {
      setDetailError(
        err instanceof ApiError && err.statusCode === 403
          ? 'The raw exception is restricted to developers (system.read).'
          : 'Could not load the exception detail.',
      );
    }
  };

  return (
    <div className="bg-bg-light border-t border-border px-4 py-3">
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="space-y-2">
        {rows.map((e) => (
          <div key={e.id} className="bg-white border border-border rounded-lg">
            <button
              onClick={() => toggle(e.id)}
              className="w-full text-left px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="text-[11px] text-text-tertiary w-28 flex-shrink-0">{fmt(e.occurredAt)}</span>
              <Badge className={SEVERITY_META[e.severity]}>{e.severity}</Badge>
              <Badge className={CATEGORY_META[e.category]}>{e.category}</Badge>
              <span className="text-xs font-mono text-text-secondary">{e.functionId}</span>
              {e.recordRef && <span className="text-[11px] text-text-tertiary font-mono">{e.recordRef}</span>}
              {e.retryable && <Badge className="bg-gray-100 text-text-secondary">retryable</Badge>}
              <span className="ml-auto text-[11px] text-text-tertiary">
                {e.migrationUnmatched ? (
                  <span title="No migration in the hub has this id">⚠ {e.migrationId}</span>
                ) : (
                  <Link
                    to={`/admin/migrations/${e.migrationId}`}
                    onClick={(ev) => ev.stopPropagation()}
                    className="text-blue-600 hover:underline"
                  >
                    Migration {e.migrationId}
                  </Link>
                )}
              </span>
              <span className="w-full text-xs text-text-primary break-words">{e.message}</span>
            </button>
            {open === e.id && (
              <div className="border-t border-border px-3 py-3 space-y-3">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div><dt className="text-text-tertiary">Event ID</dt><dd className="font-mono break-all">{e.eventId}</dd></div>
                  <div><dt className="text-text-tertiary">Error code</dt><dd className="font-mono">{e.errorCode ?? '—'}</dd></div>
                  <div><dt className="text-text-tertiary">Occurred</dt><dd>{fmt(e.occurredAt)}</dd></div>
                  <div><dt className="text-text-tertiary">Received</dt><dd>{fmt(e.receivedAt)}</dd></div>
                </dl>
                {e.context && (
                  <div>
                    <p className="text-[11px] font-semibold text-text-secondary mb-1">Context</p>
                    <pre className="text-[11px] bg-bg-light border border-border rounded-md p-2 overflow-x-auto max-h-48">
                      {JSON.stringify(e.context, null, 2)}
                    </pre>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-semibold text-text-secondary mb-1">Raw exception</p>
                  {detailError ? (
                    <p className="text-xs text-text-tertiary">{detailError}</p>
                  ) : !detail ? (
                    <p className="text-xs text-text-tertiary">Loading…</p>
                  ) : detail.rawException ? (
                    <pre className="text-[11px] bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto max-h-72 whitespace-pre-wrap break-words">
                      {detail.rawException}
                    </pre>
                  ) : (
                    <p className="text-xs text-text-tertiary">The tool did not send one.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && rows.length === 0 && !error && (
          <p className="text-xs text-text-tertiary">No errors in this group.</p>
        )}
      </div>
      {rows.length < total && (
        <button
          onClick={() => load(rows.length)}
          disabled={loading}
          className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white hover:bg-bg-light disabled:opacity-50"
        >
          {loading ? 'Loading…' : `Show more (${total - rows.length} left)`}
        </button>
      )}
    </div>
  );
};

const ErrorLogsPage: React.FC = () => {
  const [tools, setTools] = useState<ErrorTool[]>([]);
  const [tool, setTool] = useState('');
  const [status, setStatus] = useState<ErrorGroupStatus | 'all'>('OPEN');
  const [category, setCategory] = useState<ErrorCategory | ''>('');
  const [severity, setSeverity] = useState<ErrorSeverity | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [skip, setSkip] = useState(0);

  const [rows, setRows] = useState<ErrorGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setSkip(0); setExpanded(null); }, [tool, status, category, severity, debouncedSearch]);

  const loadTools = useCallback(() => {
    adminErrorLogsService.tools().then(setTools).catch(() => setTools([]));
  }, []);
  useEffect(() => { loadTools(); }, [loadTools]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminErrorLogsService.groups({
        migration_pair: tool || undefined,
        status: status === 'all' ? undefined : status,
        category: category || undefined,
        severity: severity || undefined,
        search: debouncedSearch || undefined,
        skip,
        take: PAGE_SIZE,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load error logs.');
    } finally {
      setLoading(false);
    }
  }, [tool, status, category, severity, debouncedSearch, skip]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (g: ErrorGroup, next: ErrorGroupStatus) => {
    setBusy(g.id);
    try {
      await adminErrorLogsService.setGroupStatus(g.id, next);
      await Promise.all([load(), Promise.resolve(loadTools())]);
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
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Error Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Errors reported by the migration-pair tools, grouped by cause
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Tool summary — click to filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        <button
          onClick={() => setTool('')}
          className={`text-left p-3 rounded-xl border transition-colors ${
            tool === '' ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:bg-bg-light'
          }`}
        >
          <p className="text-xs font-semibold text-text-secondary">All tools</p>
          <p className="text-lg font-bold text-text-primary">{totals.errors.toLocaleString()}</p>
          <p className="text-[11px] text-text-tertiary">{totals.open} open groups</p>
        </button>
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.code)}
            className={`text-left p-3 rounded-xl border transition-colors ${
              tool === t.code ? 'border-blue-500 bg-blue-50' : 'border-border bg-white hover:bg-bg-light'
            }`}
          >
            <p className="text-xs font-semibold text-text-secondary font-mono truncate" title={t.displayName}>{t.code}</p>
            <p className="text-lg font-bold text-text-primary">{t.errors.toLocaleString()}</p>
            <p className="text-[11px] text-text-tertiary">
              {t.openGroups} open · {t.lastErrorAt ? ago(t.lastErrorAt) : 'no errors'}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {tool ? <span className="font-mono">{tool}</span> : 'All tools'}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {total > 0 ? `${total} ${total === 1 ? 'error group' : 'error groups'}` : 'No error groups'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search message, function, code"
              className="w-56 px-3 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatus(t.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  status === t.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-light text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Tool', 'Error', 'Function', 'Type', 'Count', 'Last seen', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-text-tertiary">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm text-text-tertiary">
                    No errors match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((g) => {
                  const meta = GROUP_STATUS_META[g.status];
                  const isOpen = expanded === g.id;
                  return (
                    <React.Fragment key={g.id}>
                      <tr
                        className="border-b border-border hover:bg-bg-light cursor-pointer"
                        onClick={() => setExpanded(isOpen ? null : g.id)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                          {g.migrationPair?.code ?? '—'}
                        </td>
                        <td className="px-4 py-3 max-w-[420px]">
                          <p className="text-xs text-text-primary line-clamp-2 break-words" title={g.sampleMessage}>
                            {g.sampleMessage}
                          </p>
                          {g.latest?.errorCode && (
                            <p className="text-[11px] text-text-tertiary font-mono mt-0.5">{g.latest.errorCode}</p>
                          )}
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
                          <span className="block text-[11px] text-text-tertiary">first {ago(g.firstSeenAt)}</span>
                        </td>
                        <td className="px-4 py-3"><Badge className={meta.className}>{meta.label}</Badge></td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <select
                            value=""
                            disabled={busy === g.id}
                            onChange={(e) => e.target.value && changeStatus(g, e.target.value as ErrorGroupStatus)}
                            aria-label="Change status"
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
                            <GroupErrors group={g} />
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

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
                className="px-3 py-1.5 rounded-lg border border-border bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setSkip(skip + PAGE_SIZE)}
                className="px-3 py-1.5 rounded-lg border border-border bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorLogsPage;
