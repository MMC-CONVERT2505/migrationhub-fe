import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminMigrationReviewsService,
  type MigrationReviewGroupItem,
  type MigrationReviewListItem,
  type MigrationReviewTab,
} from '@/api/adminMigrationReviews';
import { ApiError } from '@/api/client';
import { reviewStatusMeta } from '@/constants/migrationReviewStatus';

const PAGE_SIZE = 20;

const TABS: { key: MigrationReviewTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Needs attention' },
  { key: 'resolved', label: 'Resolved' },
];

const fmt = (d: string) =>
  new Date(d).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' });

const MigrationReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<MigrationReviewTab>('all');
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [rows, setRows] = useState<MigrationReviewGroupItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Accordion: one migration expanded at a time, its requests cached by id
  // so re-collapsing/re-expanding doesn't refetch.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, MigrationReviewListItem[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<Record<string, string>>({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setSkip(0); }, [tab, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminMigrationReviewsService.listGrouped({
        tab,
        search: debouncedSearch || undefined,
        skip,
        take: PAGE_SIZE,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load review requests.');
    } finally {
      setLoading(false);
    }
  }, [tab, skip, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (migrationId: string) => {
    if (expanded === migrationId) {
      setExpanded(null);
      return;
    }
    setExpanded(migrationId);
    if (history[migrationId]) return; // already cached

    setHistoryLoading(migrationId);
    try {
      const items = await adminMigrationReviewsService.listForMigration(migrationId);
      setHistory((prev) => ({ ...prev, [migrationId]: items }));
      setHistoryError((prev) => ({ ...prev, [migrationId]: '' }));
    } catch (err) {
      setHistoryError((prev) => ({
        ...prev,
        [migrationId]: err instanceof ApiError ? err.message : 'Failed to load history.',
      }));
    } finally {
      setHistoryLoading(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Reviews</h1>
        <p className="mt-1 text-sm text-text-secondary">
          "Ask MMC to Review" requests submitted by migration tools on a customer's behalf
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Migrations with review requests</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {total > 0 ? `${total} ${total === 1 ? 'migration' : 'migrations'}` : 'No review requests'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search migration ID or pair"
                className="w-56 pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  tab === t.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-light text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['', 'Migration', 'Plan', 'Requests', 'Latest status', 'Latest reason', 'Requested'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(7).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-bg-lighter rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-text-secondary">
                    {debouncedSearch ? `No migrations match “${debouncedSearch}”` : 'No review requests to show'}
                  </td>
                </tr>
              ) : (
                rows.map((g) => {
                  const meta = reviewStatusMeta(g.latestRequest.status);
                  const isOpen = expanded === g.migrationId;
                  const items = history[g.migrationId];
                  return (
                    <React.Fragment key={g.migrationId}>
                      <tr
                        className="hover:bg-bg-light/50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(g.migrationId)}
                      >
                        <td className="px-4 py-3 w-8">
                          <svg
                            className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-text-secondary">#{g.migrationId}</div>
                          <div className="font-medium text-text-primary">
                            {g.migrationPair ? `${g.migrationPair.source.toUpperCase()} → ${g.migrationPair.destination.toUpperCase()}` : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{g.planName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-bg-light border border-border text-text-secondary">
                            ×{g.requestCount}
                          </span>
                          {g.openCount > 0 && (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> needs attention
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.className}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[260px] truncate text-xs text-text-secondary" title={g.latestRequest.reason}>
                          {g.latestRequest.reason}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                          {fmt(g.latestRequest.createdAt)}
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={7} className="bg-bg-light/60 px-4 py-3">
                            {historyLoading === g.migrationId ? (
                              <div className="py-3 space-y-2">
                                {Array(2).fill(null).map((_, i) => (
                                  <div key={i} className="h-8 bg-bg-lighter rounded animate-pulse" />
                                ))}
                              </div>
                            ) : historyError[g.migrationId] ? (
                              <p className="text-xs text-red-600 py-2">{historyError[g.migrationId]}</p>
                            ) : (
                              <ul className="divide-y divide-border rounded-lg border border-border bg-white overflow-hidden">
                                {(items ?? []).map((item) => {
                                  const im = reviewStatusMeta(item.status);
                                  return (
                                    <li
                                      key={item.id}
                                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/migration-reviews/${item.id}`); }}
                                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-bg-light cursor-pointer transition-colors"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs text-text-primary truncate">{item.reason}</p>
                                        <p className="text-[11px] text-text-secondary mt-0.5">{fmt(item.createdAt)}</p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 ${im.className}`}>
                                        {im.label}
                                      </span>
                                      <svg className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                      </svg>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg-light">
            <p className="text-xs text-text-secondary">
              Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSkip((p) => Math.max(0, p - PAGE_SIZE))}
                disabled={skip === 0}
                className="px-3 py-1 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-xs text-text-secondary">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setSkip((p) => p + PAGE_SIZE)}
                disabled={skip + PAGE_SIZE >= total}
                className="px-3 py-1 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors"
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

export default MigrationReviewsPage;
