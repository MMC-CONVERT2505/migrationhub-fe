import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { inquiryMigrationsService, type InquiryMigrationUser, type InquiryOrder } from '@/api/inquiryMigrations';
import { Badge } from '@/components/common/Badge';
import { ApiError } from '@/api/client';
import { transactionPlanLabel } from '@/constants/transactionPlans';
import { yesNo } from '@/utils/format';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip } from '@/utils/pagination';

const PAGE_SIZE = 20;

const COLUMNS = [
  'Entity', 'Order', 'Payment', 'Phone', 'Country', 'FY end', 'Migration type',
  'Add-ons', 'Tracking inv.', 'Customer', 'Submitted',
];

type OrderFilter = 'all' | 'placed' | 'incomplete';
const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'placed', label: 'Order placed' },
  { key: 'incomplete', label: 'Incomplete' },
];

const STATE_VARIANT = { PLACED: 'success', INCOMPLETE: 'error', IN_PROGRESS: 'warning' } as const;

const money = (o: InquiryOrder) =>
  o.amount != null ? `${o.currency ?? ''} ${Number(o.amount).toFixed(2)}`.trim() : null;

const InquiriesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [skip, setSkip] = useState(0);
  const [filter, setFilter] = useState<OrderFilter>('all');
  const reqId = useRef(0);

  const [rows, setRows] = useState<InquiryMigrationUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { setSkip(0); }, [debounced, filter]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const res = await inquiryMigrationsService.list({
        skip,
        take: PAGE_SIZE,
        search: debounced || undefined,
        orderStatus: filter === 'all' ? undefined : filter,
      });
      if (id !== reqId.current) return; // a newer filter/search/page already took over
      setRows(res.data);
      setTotal(res.total);
      // The list can shrink under us: never sit on a page past the end.
      const safeSkip = clampSkip(skip, res.total, PAGE_SIZE);
      if (safeSkip !== skip) setSkip(safeSkip);
    } catch (err) {
      if (id !== reqId.current) return;
      setRows([]);
      setTotal(0);
      setError(err instanceof ApiError ? err.message : 'Failed to load inquiry orders.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [skip, debounced, filter]);

  useEffect(() => { load(); }, [load]);


  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Inquiry Orders</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Every "Migration Information" submission, and whether it became an order. Incomplete ones show why, as in the Incomplete Order email.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Orders</h3>
            <p className="text-xs text-text-secondary mt-0.5">{total > 0 ? `${total} ${total === 1 ? 'inquiry order' : 'inquiry orders'}` : 'No inquiry orders yet'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, entity, phone…"
              aria-label="Search inquiry orders"
              className="px-3 py-1.5 text-xs border border-border rounded-lg bg-white w-60 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter by order status">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                    filter === f.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-bg-light text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-scroll">
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
                <tr><td colSpan={COLUMNS.length} className="text-center py-10 text-sm text-text-secondary">{debounced || filter !== 'all' ? 'No inquiry orders match these filters' : 'No inquiry orders to show'}</td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-text-primary truncate" title={r.entityName}>{r.entityName}</p>
                      <p className="text-xs text-text-secondary truncate" title={`${r.name} · ${r.email}`}>{r.name} · {r.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.order ? (
                        <div title={r.order.detail ?? undefined}>
                          <Badge variant={STATE_VARIANT[r.order.state]}>{r.order.label}</Badge>
                          {r.order.migrationId && (
                            <Link to={`/admin/migrations/${r.order.migrationId}`} className="block mt-1 text-xs text-blue-600 hover:underline">
                              View migration →
                            </Link>
                          )}
                          {r.order.state === 'INCOMPLETE' && (
                            <p className="mt-1 text-[11px] text-text-tertiary">{r.order.reportedToMmc ? 'MMC emailed' : 'MMC not emailed'}</p>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {r.order && (r.order.paymentGateway || r.order.paymentStatus) ? (
                        <>
                          <p>{[r.order.paymentGateway, r.order.paymentStatus].filter(Boolean).join(' · ')}</p>
                          {money(r.order) && <p className="font-mono text-text-primary">{money(r.order)}</p>}
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {r.phone?.trim() ? (
                        <a href={`tel:${r.phone}`} className="hover:text-blue-600 hover:underline">{r.phone}</a>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.country}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.financialYearEnd}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{transactionPlanLabel(r.transactionPlan) ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{yesNo(r.addOnsConfirmed)}</td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{yesNo(r.trackingInventory)}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs max-w-[160px] truncate" title={r.userEmail ?? ''}>{r.userEmail ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">{new Date(r.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination skip={skip} size={PAGE_SIZE} total={total} noun="inquiry orders" disabled={loading} onSkipChange={setSkip} />
      </div>
    </motion.div>
  );
};

export default InquiriesPage;
