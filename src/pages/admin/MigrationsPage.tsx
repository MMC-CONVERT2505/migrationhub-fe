import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminMigrationsService,
  type AdminMigrationListItem,
  type MigrationStatusGroup,
} from '@/api/adminMigrations';
import { ApiError } from '@/api/client';
import { statusMeta } from '@/constants/migrationStatus';
import { karbonPrimaryMeta, karbonSyncMeta } from '@/constants/karbonStatus';

const PAGE_SIZE = 20;

type Tab = 'all' | MigrationStatusGroup;
const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
];

const MigrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [rows, setRows] = useState<AdminMigrationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Any filter change resets pagination back to the first page.
  useEffect(() => { setSkip(0); }, [tab, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminMigrationsService.list({
        group: tab === 'all' ? undefined : tab,
        search: debouncedSearch || undefined,
        skip,
        take: PAGE_SIZE,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load migrations.');
    } finally {
      setLoading(false);
    }
  }, [tab, skip, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migrations</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Track every migration across the platform and drill into its progress and logs
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
            <h3 className="text-sm font-bold text-text-primary">All migrations</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {total > 0 ? `${total} ${total === 1 ? 'migration' : 'migrations'}` : 'No migrations'}
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
                placeholder="Search ID, name, email, entity"
                className="w-56 pl-8 pr-7 py-1.5 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
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
                {['Migration', 'Customer', 'Status', 'Karbon', 'Progress', 'Created', ''].map((h) => (
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
                  <td colSpan={7} className="text-center py-10 text-sm text-text-tertiary">
                    {debouncedSearch ? `No migrations match “${debouncedSearch}”` : 'No migrations to show'}
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  const meta = statusMeta(m.status);
                  return (
                    <tr key={m.id} className="hover:bg-bg-light/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-text-tertiary">#{m.id}</div>
                        <div className="font-medium text-text-primary">
                          {m.migrationPair.source.toUpperCase()} → {m.migrationPair.destination.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {m.customer.name || m.customer.email || m.customer.entityName ? (
                          <>
                            <div className="text-text-primary text-xs font-medium truncate" title={m.customer.name ?? ''}>
                              {m.customer.name ?? m.customer.email}
                            </div>
                            <div className="text-text-tertiary text-[11px] truncate" title={[m.customer.entityName, m.customer.email].filter(Boolean).join(' · ')}>
                              {m.customer.name
                                ? [m.customer.entityName, m.customer.email].filter(Boolean).join(' · ')
                                : m.customer.entityName ?? ''}
                            </div>
                          </>
                        ) : (
                          <span className="text-text-tertiary text-xs">Anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {m.karbonWorkItem ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${karbonSyncMeta(m.karbonWorkItem.syncStatus).className}`}
                            title={
                              m.karbonWorkItem.lastError ??
                              `${karbonPrimaryMeta(m.karbonWorkItem.primaryStatus).label} in Karbon`
                            }
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${karbonSyncMeta(m.karbonWorkItem.syncStatus).dot}`} />
                            {karbonPrimaryMeta(m.karbonWorkItem.primaryStatus).label}
                          </span>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-lighter rounded-full overflow-hidden min-w-[64px]">
                            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${m.progress}%` }} />
                          </div>
                          <span className="text-xs text-text-tertiary tabular-nums w-8 text-right">{m.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-tertiary whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/admin/migrations/${m.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg-light">
            <p className="text-xs text-text-tertiary">
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

export default MigrationsPage;
