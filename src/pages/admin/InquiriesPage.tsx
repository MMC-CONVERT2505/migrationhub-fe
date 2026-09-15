import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { inquiryMigrationsService, type InquiryMigrationUser } from '@/api/inquiryMigrations';
import { ApiError } from '@/api/client';
import { transactionPlanLabel } from '@/constants/transactionPlans';
import { yesNo } from '@/utils/format';

const PAGE_SIZE = 20;

const COLUMNS = [
  'Entity', 'Phone', 'Country', 'FY end', 'Migration type',
  'Add-ons', 'Tracking inv.', 'Customer', 'Submitted',
];

const InquiriesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [skip, setSkip] = useState(0);

  const [rows, setRows] = useState<InquiryMigrationUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setSkip(0); }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await inquiryMigrationsService.list({ skip, take: PAGE_SIZE, search: debounced || undefined });
      setRows(res.data);
      setTotal(res.total);
    } catch (err) {
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  }, [skip, debounced]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Inquiries</h1>
        <p className="mt-1 text-sm text-text-secondary">"Migration Information" forms submitted by users during the migration flow</p>
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
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Submissions</h3>
            <p className="text-xs text-text-secondary mt-0.5">{total > 0 ? `${total} ${total === 1 ? 'inquiry' : 'inquiries'}` : 'No inquiries yet'}</p>
          </div>
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entity, country, phone…"
            className="px-3 py-1.5 text-xs border border-border rounded-lg bg-white w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i}>{COLUMNS.map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-bg-lighter rounded animate-pulse w-16" /></td>
                  ))}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr><td colSpan={COLUMNS.length} className="text-center py-10 text-sm text-text-tertiary">{debounced ? 'No inquiries match your search' : 'No inquiries to show'}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary max-w-[180px] truncate" title={r.entityName}>{r.entityName}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      <a href={`tel:${r.phone}`} className="hover:text-blue-600 hover:underline">{r.phone}</a>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.country}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.financialYearEnd}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{transactionPlanLabel(r.transactionPlan) ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{yesNo(r.addOnsConfirmed)}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{yesNo(r.trackingInventory)}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-[160px] truncate" title={r.userEmail ?? ''}>{r.userEmail ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-tertiary whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-bg-light">
            <p className="text-xs text-text-tertiary">Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setSkip((p) => Math.max(0, p - PAGE_SIZE))} disabled={skip === 0} className="px-3 py-1 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">Previous</button>
              <span className="px-3 py-1 text-xs text-text-secondary">{currentPage} / {totalPages}</span>
              <button onClick={() => setSkip((p) => p + PAGE_SIZE)} disabled={skip + PAGE_SIZE >= total} className="px-3 py-1 text-xs font-medium border border-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InquiriesPage;
