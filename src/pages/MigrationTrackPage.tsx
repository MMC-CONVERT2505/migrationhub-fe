import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { FlowStepper } from '@/components/migration/FlowStepper';
import { JourneyTimeline } from '@/components/migration/JourneyTimeline';
import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';
import { PLATFORM_COLORS, PLATFORM_ABBR } from '@/constants/logos';
import { normalizePlatform } from '@/utils/platformMap';
import type { UserMigration } from '@/types/api';

const POLL_MS = 5000;

const TERMINAL = new Set([
  'COMPLETED',
  'PARTIAL_SUCCESS',
  // Finished — a help request must not make it look live and keep polling.
  'UNDER_REVIEW',
  'FAILED',
  'PAYMENT_FAILED',
  'CANCELLED',
]);

type BadgeVariant = 'default' | 'info' | 'success' | 'error' | 'warning';

const statusBadge = (status: string): { label: string; variant: BadgeVariant; pulse: boolean } => {
  switch (status) {
    case 'COMPLETED':       return { label: 'Completed', variant: 'success', pulse: false };
    case 'PARTIAL_SUCCESS': return { label: 'Partial success', variant: 'warning', pulse: false };
    case 'UNDER_REVIEW':    return { label: 'Under review', variant: 'warning', pulse: false };
    case 'FAILED':          return { label: 'Failed', variant: 'error', pulse: false };
    case 'PAYMENT_FAILED':  return { label: 'Payment failed', variant: 'error', pulse: false };
    case 'CANCELLED':       return { label: 'Cancelled', variant: 'default', pulse: false };
    case 'DRAFT':           return { label: 'Draft', variant: 'default', pulse: false };
    default:                return { label: 'In progress', variant: 'info', pulse: true };
  }
};

const PlatformPill: React.FC<{ platform: string }> = ({ platform }) => {
  const name = normalizePlatform(platform);
  const color = PLATFORM_COLORS[name] ?? '#64748b';
  const abbr = PLATFORM_ABBR[name] ?? name.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {abbr}
    </div>
  );
};

const MigrationTrackPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState<UserMigration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshFailed, setRefreshFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await migrationsService.getById(id);
      setM(data);
      setError('');
      setRefreshFailed(false);
    } catch (err) {
      if (silent) setRefreshFailed(true);
      else setError(err instanceof ApiError ? err.message : 'Failed to load migration.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll while still in flight; stop once terminal.
  useEffect(() => {
    if (!m || TERMINAL.has(m.status)) return;
    timer.current = setInterval(() => load(true), POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [m, load]);

  const live = m ? !TERMINAL.has(m.status) : false;
  // Server can return statuses beyond the narrow client union (e.g. PARTIAL_SUCCESS),
  // so compare as a plain string here.
  const status: string = m?.status ?? '';
  const showProgress =
    live || status === 'COMPLETED' || status === 'PARTIAL_SUCCESS' || status === 'UNDER_REVIEW';

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar showBack />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FlowStepper
          page="track"
          // No payment on record (free pair, $0 plan, or Operation Team waiver) means no Pay stage.
          free={m ? m.migrationPair.isFree || Number(m.plan.basePrice) === 0 || m.paymentId == null : undefined}
          className="max-w-xl mx-auto mb-8"
        />
        <Link to="/migrations" className="text-sm text-blue-600 hover:underline">← Back to my migrations</Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary">Loading migration…</p>
          </div>
        )}

        {!loading && (error || !m) && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error || 'Migration not found.'}
            <button onClick={() => navigate('/migrations')} className="ml-2 underline">Go back</button>
          </div>
        )}

        {!loading && m && refreshFailed && (
          <div role="status" className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            We couldn&apos;t refresh the latest status. What you see may be out of date, and we&apos;ll keep trying.
          </div>
        )}

        {!loading && m && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Header */}
            <div className="mt-4 mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <PlatformPill platform={m.migrationPair.source} />
                <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <PlatformPill platform={m.migrationPair.destination} />
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-text-primary truncate">{m.migrationPair.displayName}</h1>
                  <p className="text-xs text-text-tertiary font-mono mt-0.5">ID: {m.id}</p>
                </div>
              </div>
              {(() => {
                const b = statusBadge(m.status);
                return (
                  <Badge variant={b.variant} className="flex-shrink-0">
                    {b.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse mr-1" />}
                    {b.label}
                  </Badge>
                );
              })()}
            </div>

            {/* Progress (while running / done) */}
            {showProgress && (
              <div className="bg-white border border-border rounded-xl shadow-card p-5 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-text-primary">Overall progress</p>
                  <span className="text-sm font-bold text-text-primary tabular-nums">{m.progress}%</span>
                </div>
                <div className="h-2 bg-bg-lighter rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${status === 'FAILED' ? 'bg-red-500' : status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
                {m.currentCategory && live && (
                  <p className="text-xs text-text-tertiary mt-2">
                    Processing: <span className="font-medium text-text-secondary">{m.currentCategory}</span>
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {m.errorMessage && (m.status === 'FAILED') && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {m.errorMessage}{m.failedCategory ? ` (in ${m.failedCategory})` : ''}
              </div>
            )}

            {/* Journey */}
            <section className="bg-white border border-border rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-text-primary">Migration journey</h2>
                {live && (
                  <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
                  </span>
                )}
              </div>
              <JourneyTimeline stages={m.journey ?? []} />
            </section>

            <p className="mt-4 text-xs text-text-tertiary">
              {live
                ? 'This page updates automatically. You can safely leave and come back — we’ll email you when it’s done.'
                : 'A confirmation email was sent to your billing address.'}
            </p>
          </motion.div>
        )}
      </div>
      <CompactFooter />
    </div>
  );
};

export default MigrationTrackPage;
