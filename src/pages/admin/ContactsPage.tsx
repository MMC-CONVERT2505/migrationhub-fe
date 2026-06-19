import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { contactService, type ContactItem } from '@/api/contact';
import { ApiError } from '@/api/client';

const PAGE_SIZE = 20;

type ReachedFilter = 'all' | 'pending' | 'done';
const TABS: { key: ReachedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Not reached out' },
  { key: 'done', label: 'Reached out' },
];

const ContactsPage: React.FC = () => {
  const [filter, setFilter] = useState<ReachedFilter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [skip, setSkip] = useState(0);

  const [rows, setRows] = useState<ContactItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to the first page whenever the filter or search changes.
  useEffect(() => { setSkip(0); }, [filter, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await contactService.list({
        skip,
        take: PAGE_SIZE,
        isReachedOut: filter === 'all' ? undefined : filter === 'done',
        search: debouncedSearch || undefined,
      });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load contacts.');
    } finally {
      setLoading(false);
    }
  }, [skip, filter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // Optimistic flag toggle with rollback on failure.
  const toggle = async (row: ContactItem, field: 'isReachedOut') => {
    if (savingId !== null) return;
    const next = !row[field];
    setSavingId(row.id);
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: next } : r)));
    try {
      await contactService.update(row.id, { [field]: next });
      // If this toggle moves the row out of the active filter, drop it from view.
      if (filter !== 'all') {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        setTotal((t) => Math.max(0, t - 1));
      }
    } catch (err) {
      // Roll back the optimistic change.
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: !next } : r)));
      setError(err instanceof ApiError ? err.message : 'Failed to update contact.');
    } finally {
      setSavingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Contacts</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Enquiries submitted through the marketing-site contact form
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
            <h3 className="text-sm font-bold text-text-primary">Submissions</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {total > 0 ? `${total} ${total === 1 ? 'enquiry' : 'enquiries'}` : 'No enquiries yet'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or company…"
              className="px-3 py-1.5 text-xs border border-border rounded-lg bg-white w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-bg-light text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Company', 'Email', 'Phone', 'Country', 'Reached out', 'Submitted'].map((h) => (
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
                    {Array(6).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-bg-lighter rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-text-tertiary">
                    {debouncedSearch ? 'No contacts match your search' : 'No contacts to show'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary max-w-[200px] truncate" title={row.companyName}>
                      {row.companyName}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      <a href={`mailto:${row.email}`} className="hover:text-blue-600 hover:underline">{row.email}</a>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {row.phone ? (
                        <a href={`tel:${row.phone}`} className="hover:text-blue-600 hover:underline">{row.phone}</a>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{row.country}</td>
                    <td className="px-4 py-3">
                      <FlagToggle
                        active={row.isReachedOut}
                        disabled={savingId === row.id}
                        onClick={() => toggle(row, 'isReachedOut')}
                        activeLabel="Reached out"
                        inactiveLabel="Mark done"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-tertiary whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
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

// ─── Flag pill toggle ─────────────────────────────────────────────────────────
const FlagToggle: React.FC<{
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  activeLabel: string;
  inactiveLabel: string;
}> = ({ active, disabled, onClick, activeLabel, inactiveLabel }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      active
        ? 'bg-green-50 text-green-700 hover:bg-green-100'
        : 'bg-bg-light text-text-secondary border border-border hover:text-text-primary'
    }`}
    title={active ? 'Click to unset' : 'Click to set'}
  >
    {active ? activeLabel : inactiveLabel}
  </button>
);

export default ContactsPage;
