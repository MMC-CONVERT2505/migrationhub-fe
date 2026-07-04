import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportsService, type ReportDetail, type ReportPairSummary } from '@/api/reports';
import { ApiError } from '@/api/client';
import { normalizePlatform } from '@/utils/platformMap';
import { Spinner } from '@/components/common/Spinner';
import { ReportView } from '@/components/admin/ReportView';

type Filter = 'all' | 'with' | 'without';
const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All pairs' },
  { key: 'with', label: 'With report' },
  { key: 'without', label: 'No data' },
];

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

const ReportsPage: React.FC = () => {
  const [rows, setRows] = useState<ReportPairSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Accordion state — one pair open at a time, with a lazy-loaded report cache.
  const [openId, setOpenId] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, ReportDetail>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await reportsService.listPairs());
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fetchReport = useCallback(
    async (pair: ReportPairSummary) => {
      if (!pair.hasReport || reports[pair.id]) return;
      setDetailLoadingId(pair.id);
      setDetailErrors((p) => ({ ...p, [pair.id]: '' }));
      try {
        const detail = await reportsService.getByPairId(pair.id);
        setReports((p) => ({ ...p, [pair.id]: detail }));
      } catch (err) {
        setDetailErrors((p) => ({
          ...p,
          [pair.id]: err instanceof ApiError ? err.message : 'Failed to load report.',
        }));
      } finally {
        setDetailLoadingId(null);
      }
    },
    [reports],
  );

  const toggle = (pair: ReportPairSummary) => {
    if (openId === pair.id) {
      setOpenId(null);
      return;
    }
    setOpenId(pair.id);
    void fetchReport(pair);
  };

  const visible = useMemo(
    () =>
      rows.filter((r) =>
        filter === 'all' ? true : filter === 'with' ? r.hasReport : !r.hasReport,
      ),
    [rows, filter],
  );

  const withReport = rows.filter((r) => r.hasReport).length;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Daily per-pair order reports. Click a pair to open its latest report.
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
            <h3 className="text-sm font-bold text-text-primary">Migration pairs</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {loading ? 'Loading…' : `${withReport} of ${rows.length} pairs have report data`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-border">
          {loading ? (
            Array(6).fill(null).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-4 bg-bg-lighter rounded animate-pulse w-48" />
              </div>
            ))
          ) : visible.length === 0 ? (
            <div className="text-center py-14 text-sm text-text-tertiary">
              No migration pairs to show
            </div>
          ) : (
            visible.map((pair) => {
              const isOpen = openId === pair.id;
              return (
                <div key={pair.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggle(pair)}
                    aria-expanded={isOpen}
                    className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                      isOpen ? 'bg-bg-light' : 'hover:bg-bg-light/50'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 flex-shrink-0 text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                        {normalizePlatform(pair.source)}
                      </span>
                      <svg className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                        {normalizePlatform(pair.destination)}
                      </span>
                      <span className="hidden md:inline text-xs text-text-tertiary truncate ml-1">
                        {pair.displayName}
                      </span>
                    </div>

                    {/* Summary (when a report exists) */}
                    {pair.hasReport && (
                      <div className="hidden sm:flex items-center gap-5 text-xs text-text-secondary whitespace-nowrap">
                        <Meta label="Orders" value={String(pair.totalOrders ?? 0)} />
                        <Meta label="Avg" value={pair.averageDays != null ? `${pair.averageDays}d` : '—'} />
                        <Meta label="Run" value={fmtDate(pair.runDate)} />
                      </div>
                    )}

                    {pair.hasReport ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Report
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white text-text-tertiary border border-border flex-shrink-0">
                        No data
                      </span>
                    )}
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-1 bg-bg-light/40">
                          {detailLoadingId === pair.id ? (
                            <div className="flex items-center justify-center py-10">
                              <Spinner size="md" />
                            </div>
                          ) : detailErrors[pair.id] ? (
                            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-700">{detailErrors[pair.id]}</p>
                            </div>
                          ) : reports[pair.id] ? (
                            <ReportView report={reports[pair.id]} />
                          ) : (
                            <div className="py-8 text-center">
                              <p className="text-sm font-semibold text-text-primary">No report yet</p>
                              <p className="mt-1 text-xs text-text-secondary">
                                No report has been ingested for this pair. It will appear here after the next daily run.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Meta: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className="flex items-center gap-1">
    <span className="text-text-tertiary">{label}:</span>
    <span className="font-semibold text-text-primary">{value}</span>
  </span>
);

export default ReportsPage;
