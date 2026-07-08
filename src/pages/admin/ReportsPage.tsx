import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportsService, type ReportDetail, type ReportPairSummary } from '@/api/reports';
import { ApiError } from '@/api/client';
import { normalizePlatform } from '@/utils/platformMap';
import { PLATFORM_ABBR, PLATFORM_COLORS, platformLogo } from '@/constants/logos';
import { PlatformMark } from '@/components/common/PlatformMark';
import { Spinner } from '@/components/common/Spinner';
import { ReportView } from '@/components/admin/ReportView';
import { cn } from '@/utils/format';

// ── Tool categorisation ──────────────────────────────────────────────────────
// The data carries no automated/semi-automated flag, so a pair is classified here
// by its "<source>→<destination>" key. Anything listed below is an *automated*
// tool; every other pair (including any newly-added one) is semi-automated, so a
// new pair always surfaces somewhere rather than silently disappearing.
const AUTOMATED_PAIRS = new Set<string>([
  'xero→myob',
  'qbo→myob',
  'xero→qbo',
  'xero→prosaic',
  'xero→reckon',
  'myob→qbo',
  'qbo→freshbooks',
  'qbo→xero',
]);

// Red/green thresholds per section: avg over the threshold is red, at-or-under is
// green (requirement: automated > 2d red, semi-automated > 3d red).
const AUTOMATED_THRESHOLD_DAYS = 2;
const SEMI_AUTOMATED_THRESHOLD_DAYS = 3;

const pairKey = (p: ReportPairSummary) =>
  `${p.source.toLowerCase()}→${p.destination.toLowerCase()}`;

const isAutomated = (p: ReportPairSummary) => AUTOMATED_PAIRS.has(pairKey(p));

type Tone = 'red' | 'green' | 'neutral';

// Neutral when there's no timeline yet — no threshold verdict can be given.
const timelineTone = (avg: number | null, thresholdDays: number): Tone =>
  avg == null ? 'neutral' : avg > thresholdDays ? 'red' : 'green';

const fmtDays = (n: number | null) =>
  n == null ? '—' : `${n} ${n === 1 ? 'day' : 'days'}`;

const ReportsPage: React.FC = () => {
  const [rows, setRows] = useState<ReportPairSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // One report open at a time (across both sections), lazily loaded + cached by
  // the pair's unique id so two pairs can never share a snapshot.
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

  const toggle = useCallback(
    (pair: ReportPairSummary) => {
      setOpenId((cur) => (cur === pair.id ? null : pair.id));
      void fetchReport(pair);
    },
    [fetchReport],
  );

  const automated = useMemo(() => rows.filter(isAutomated), [rows]);
  const semiAutomated = useMemo(() => rows.filter((r) => !isAutomated(r)), [rows]);
  const withReport = useMemo(() => rows.filter((r) => r.hasReport).length, [rows]);

  const detailProps = { openId, reports, detailLoadingId, detailErrors, onToggle: toggle };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Daily migration performance by tool.
          {!loading && rows.length > 0 && ` ${withReport} of ${rows.length} tools have report data.`}
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

      {loading ? (
        <SectionSkeletons />
      ) : (
        <div className="space-y-8">
          <Section
            title="Automated migration tools"
            subtitle="Fully automated conversions"
            thresholdDays={AUTOMATED_THRESHOLD_DAYS}
            pairs={automated}
            {...detailProps}
          />
          <Section
            title="Semi-automated migration tools"
            subtitle="Assisted / manual conversions"
            thresholdDays={SEMI_AUTOMATED_THRESHOLD_DAYS}
            pairs={semiAutomated}
            {...detailProps}
          />
        </div>
      )}
    </motion.div>
  );
};

// ── Section ──────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle: string;
  thresholdDays: number;
  pairs: ReportPairSummary[];
  openId: string | null;
  reports: Record<string, ReportDetail>;
  detailLoadingId: string | null;
  detailErrors: Record<string, string>;
  onToggle: (p: ReportPairSummary) => void;
}

// Live column count of the responsive card grid, matching the Tailwind classes
// below (grid-cols-1 / sm:grid-cols-2 / lg:grid-cols-3). Used to drop the open
// report directly beneath the clicked card's *row* rather than at section end.
function gridColumns(): number {
  if (typeof window === 'undefined') return 3;
  const w = window.innerWidth;
  if (w >= 1024) return 3; // lg
  if (w >= 640) return 2; // sm
  return 1;
}

function useGridColumns(): number {
  const [cols, setCols] = useState(gridColumns);
  useEffect(() => {
    const onResize = () => setCols(gridColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return cols;
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  thresholdDays,
  pairs,
  openId,
  reports,
  detailLoadingId,
  detailErrors,
  onToggle,
}) => {
  const cols = useGridColumns();

  // The open pair, only if it belongs to this section (so its detail renders here).
  const openIndex = pairs.findIndex((p) => p.id === openId);
  const openPair = openIndex >= 0 ? pairs[openIndex] : null;
  const openPairId = openPair?.id ?? null;

  // Scroll the report into view when it opens (it mounts with a spinner first, so
  // the element exists immediately). `nearest` avoids a jarring jump when it's
  // already visible directly under the clicked card.
  useEffect(() => {
    if (!openPairId) return;
    document
      .getElementById(`report-panel-${openPairId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [openPairId]);

  // Index of the last card sharing the open card's visual row, so the report is
  // inserted right after that row (col-span-full) — directly under the clicked card.
  const rowEndIndex =
    openIndex < 0
      ? -1
      : Math.min(Math.floor(openIndex / cols) * cols + (cols - 1), pairs.length - 1);

  return (
    <section className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
      {/* Section header + colour-key legend */}
      <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            {pairs.length} {pairs.length === 1 ? 'tool' : 'tools'} · {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold whitespace-nowrap">
          <span className="inline-flex items-center gap-1 text-green-600"><Dot tone="green" /> ≤ {thresholdDays}d avg</span>
          <span className="inline-flex items-center gap-1 text-red-600"><Dot tone="red" /> &gt; {thresholdDays}d avg</span>
        </div>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-12 text-sm text-text-tertiary">No tools in this category.</div>
      ) : (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pairs.map((pair, i) => (
            <React.Fragment key={pair.id}>
              <ToolCard
                pair={pair}
                thresholdDays={thresholdDays}
                isOpen={openId === pair.id}
                onToggle={onToggle}
              />

              {/* Report detail, dropped full-width beneath the open card's row */}
              <AnimatePresence initial={false}>
                {i === rowEndIndex && openPair && (
                  <motion.div
                    key={openPair.id}
                    id={`report-panel-${openPair.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="col-span-full overflow-hidden scroll-mt-4"
                  >
                    <ReportDetailPanel
                      pair={openPair}
                      loading={detailLoadingId === openPair.id}
                      error={detailErrors[openPair.id]}
                      report={reports[openPair.id]}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
};

// Loading / error / report / empty states for the open pair's detail panel.
const ReportDetailPanel: React.FC<{
  pair: ReportPairSummary;
  loading: boolean;
  error?: string;
  report?: ReportDetail;
}> = ({ pair, loading, error, report }) => (
  <div className="rounded-xl border border-border bg-bg-light/50 p-4">
    {loading ? (
      <div className="flex items-center justify-center py-10"><Spinner size="md" /></div>
    ) : error ? (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    ) : report ? (
      <ReportView
        report={report}
        sourceLogo={pair.sourceLogo}
        destinationLogo={pair.destinationLogo}
      />
    ) : (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-text-primary">No report yet</p>
        <p className="mt-1 text-xs text-text-secondary">
          No report has been ingested for this pair. It will appear here after the next daily run.
        </p>
      </div>
    )}
  </div>
);

// ── Tool card ────────────────────────────────────────────────────────────────

interface ToolCardProps {
  pair: ReportPairSummary;
  thresholdDays: number;
  isOpen: boolean;
  onToggle: (p: ReportPairSummary) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({
  pair,
  thresholdDays,
  isOpen,
  onToggle,
}) => {
  const srcName = normalizePlatform(pair.source);
  const dstName = normalizePlatform(pair.destination);

  const tone = timelineTone(pair.averageDays, thresholdDays);
  const interactive = pair.hasReport;

  const toneText =
    tone === 'red'
      ? 'text-red-600'
      : tone === 'green'
        ? 'text-green-600'
        : 'text-text-secondary';

  const toneBox =
    tone === 'red'
      ? 'bg-red-50 border-red-100'
      : tone === 'green'
        ? 'bg-green-50 border-green-100'
        : 'bg-bg-light border-border';

  return (
    <button
      type="button"
      onClick={interactive ? () => onToggle(pair) : undefined}
      disabled={!interactive}
      aria-expanded={interactive ? isOpen : undefined}
      className={cn(
        'w-full rounded-xl border p-4 text-left transition-all',
        interactive
          ? 'cursor-pointer hover:border-blue-200 hover:shadow-card'
          : 'cursor-default opacity-70',
        isOpen
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/30'
          : 'border-border bg-white',
      )}
    >
      {/* Pair logos — bare (no surrounding box), sized large for clarity. Prefer the
          bundled public-folder brand logo, falling back to the pair's DB logo. */}
      <div className="flex items-center justify-center gap-4">
        <PlatformMark
          bare
          logo={platformLogo(pair.source) ?? pair.sourceLogo}
          name={srcName}
          abbr={PLATFORM_ABBR[srcName] ?? srcName.slice(0, 2).toUpperCase()}
          color={PLATFORM_COLORS[srcName] ?? '#64748b'}
          className="w-16 h-16 rounded-xl"
          textClassName="text-lg"
        />

        <svg
          className="w-5 h-5 flex-shrink-0 text-text-tertiary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>

        <PlatformMark
          bare
          logo={platformLogo(pair.destination) ?? pair.destinationLogo}
          name={dstName}
          abbr={PLATFORM_ABBR[dstName] ?? dstName.slice(0, 2).toUpperCase()}
          color={PLATFORM_COLORS[dstName] ?? '#64748b'}
          className="w-16 h-16 rounded-xl"
          textClassName="text-lg"
        />
      </div>

      <span className="sr-only">
        {srcName} to {dstName}
      </span>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className={cn('rounded-lg border px-3 py-2', toneBox)}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            Average timeline
          </p>

          <p
            className={cn(
              'mt-0.5 flex items-center gap-1.5 text-sm font-bold',
              toneText,
            )}
          >
            {tone !== 'neutral' && (
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  tone === 'red' ? 'bg-red-500' : 'bg-green-500',
                )}
              />
            )}
            {fmtDays(pair.averageDays)}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-bg-light px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
            Files completed
          </p>

          <p className="mt-0.5 text-sm font-bold text-text-primary">
            {pair.hasReport ? (pair.totalOrders ?? 0) : '—'}
          </p>
        </div>
      </div>

      {interactive ? (
        <p className="mt-3 text-center text-[11px] font-semibold text-blue-600">
          {isOpen ? 'Hide report ▲' : 'View report ▼'}
        </p>
      ) : (
        <p className="mt-3 text-center text-[11px] font-medium text-text-tertiary">
          No report data yet
        </p>
      )}
    </button>
  );
};

const Dot: React.FC<{ tone: 'red' | 'green' }> = ({ tone }) => (
  <span className={cn('w-1.5 h-1.5 rounded-full', tone === 'red' ? 'bg-red-500' : 'bg-green-500')} />
);

const SectionSkeletons: React.FC = () => (
  <div className="space-y-8">
    {[0, 1].map((s) => (
      <div key={s} className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-bg-light">
          <div className="h-4 w-48 bg-bg-lighter rounded animate-pulse" />
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="h-11 w-32 mx-auto bg-bg-lighter rounded-lg animate-pulse" />
              <div className="mt-4 h-14 bg-bg-lighter rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default ReportsPage;
