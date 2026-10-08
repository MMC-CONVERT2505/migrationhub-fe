import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminMigrationsService,
  type AdminMigrationDetail,
} from '@/api/adminMigrations';
import { ApiError } from '@/api/client';
import { yesNo } from '@/utils/format';
import { statusMeta, isTerminal, isQaAllowed } from '@/constants/migrationStatus';
import { JourneyTimeline } from '@/components/migration/JourneyTimeline';
import { KarbonSyncCard } from '@/components/admin/KarbonSyncCard';

const POLL_MS = 5000;

const EVENT_LABELS: Record<string, string> = {
  OAUTH_SOURCE_COMPLETED:       'Source authenticated',
  OAUTH_DESTINATION_COMPLETED:  'Destination authenticated',
  DATA_COUNT_READY:             'Data count ready',
  MIGRATION_QUEUED:             'Queued',
  MIGRATION_STARTED:            'Migration started',
  MIGRATION_PROGRESS:           'Progress update',
  MIGRATION_CATEGORY_COMPLETED: 'Category completed',
  MIGRATION_COMPLETED:          'Migration completed',
  MIGRATION_PARTIAL_SUCCESS:    'Completed with partial success',
  MIGRATION_UNDER_REVIEW:       'Customer requested help',
  MIGRATION_FAILED:             'Migration failed',
  MIGRATION_CANCELLED:          'Migration cancelled',
};

const LOG_LEVEL_STYLES: Record<string, string> = {
  SUCCESS: 'bg-green-50 text-green-700',
  INFO:    'bg-blue-50 text-blue-700',
  WARNING: 'bg-yellow-50 text-yellow-700',
  FAILED:  'bg-red-50 text-red-700',
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const MigrationDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const [m, setM] = useState<AdminMigrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingQa, setSavingQa] = useState(false);
  const [qaError, setQaError] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminMigrationsService.getById(id);
      setM(data);
      setError('');
    } catch (err) {
      if (!silent) setError(err instanceof ApiError ? err.message : 'Failed to load migration.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Poll while the migration is still in flight; stop once terminal.
  useEffect(() => {
    if (!m || isTerminal(m.status)) return;
    timer.current = setInterval(() => load(true), POLL_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [m, load]);

  const setQa = async (isQaPassed: boolean) => {
    if (savingQa) return;
    setSavingQa(true);
    setQaError('');
    try {
      const updated = await adminMigrationsService.setQa(id, isQaPassed);
      setM((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (err) {
      setQaError(err instanceof ApiError ? err.message : 'Failed to update QA status.');
    } finally {
      setSavingQa(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-64 bg-bg-lighter rounded animate-pulse" />
        <div className="h-40 bg-bg-lighter rounded-xl animate-pulse" />
        <div className="h-64 bg-bg-lighter rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !m) {
    return (
      <div>
        <Link to="/admin/migrations" className="text-sm text-blue-600 hover:underline">← Back to migrations</Link>
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Migration not found.'}
        </div>
      </div>
    );
  }

  const meta = statusMeta(m.status);
  const qaAllowed = isQaAllowed(m.status);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <Link to="/admin/migrations" className="text-sm text-blue-600 hover:underline">← Back to migrations</Link>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {m.migrationPair.source.toUpperCase()} → {m.migrationPair.destination.toUpperCase()}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>{meta.label}</span>
            {!isTerminal(m.status) && (
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-text-tertiary font-mono">#{m.id} · {m.migrationPair.displayName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Overall progress</h3>
              <span className="text-2xl font-bold text-text-primary tabular-nums">{m.progress}%</span>
            </div>
            <div className="h-2.5 bg-bg-lighter rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${m.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${m.progress}%` }}
              />
            </div>
            {m.currentCategory && (
              <p className="mt-2 text-xs text-text-secondary">Current category: <span className="font-medium text-text-primary">{m.currentCategory}</span></p>
            )}
            {m.errorMessage && (
              <p className="mt-2 text-xs text-red-600">Error: {m.errorMessage}{m.failedCategory ? ` (in ${m.failedCategory})` : ''}</p>
            )}

            {/* Milestones */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              <Milestone label="Created" value={fmt(m.createdAt)} done />
              <Milestone label="Started" value={fmt(m.startedAt)} done={!!m.startedAt} />
              <Milestone
                label={m.status === 'FAILED' ? 'Failed' : 'Completed'}
                value={fmt(m.completedAt)}
                done={!!m.completedAt}
                danger={m.status === 'FAILED'}
              />
            </div>
          </section>

          {/* End-to-end journey */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-4">Migration journey</h3>
            <JourneyTimeline stages={m.journey} />

            {/* Raw tool lifecycle events — secondary, for debugging */}
            {m.webhookEvents.length > 0 && (
              <details className="mt-5 border-t border-border pt-4 group">
                <summary className="text-xs font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary">
                  Raw lifecycle events ({m.webhookEvents.length})
                </summary>
                <ol className="relative border-l border-border ml-2 mt-4">
                  {m.webhookEvents.map((e, i) => {
                    const failed = e.eventType === 'MIGRATION_FAILED' || e.status === 'FAILED';
                    return (
                      <li key={`${e.eventType}-${e.receivedAt}-${i}`} className="ml-5 pb-4 last:pb-0">
                        <span className={`absolute -left-[6px] w-3 h-3 rounded-full border-2 border-white ${failed ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text-primary">{EVENT_LABELS[e.eventType] ?? e.eventType}</p>
                          <time className="text-xs text-text-tertiary whitespace-nowrap">{fmt(e.receivedAt)}</time>
                        </div>
                        {e.failureReason && <p className="text-xs text-red-600 mt-0.5">{e.failureReason}</p>}
                      </li>
                    );
                  })}
                </ol>
              </details>
            )}
          </section>

          {/* Logs */}
          <section className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-bg-light flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Logs</h3>
              <span className="text-xs text-text-tertiary">{m.logs.length} entries</span>
            </div>
            {m.logs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-tertiary">No logs recorded yet.</p>
            ) : (
              <ul className="divide-y divide-border max-h-[460px] overflow-y-auto">
                {m.logs.map((log) => (
                  <li key={log.id} className="px-5 py-3 flex items-start gap-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex-shrink-0 ${LOG_LEVEL_STYLES[log.level] ?? 'bg-bg-light text-text-secondary'}`}>
                      {log.level}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary break-words">{log.message}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {[log.service, log.category].filter(Boolean).join(' · ')}
                        {(log.service || log.category) ? ' · ' : ''}
                        {fmt(log.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* QA action */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-1">Manual QA</h3>
            <p className="text-xs text-text-secondary mb-3">
              {m.isQaPassed === null
                ? 'Not yet reviewed.'
                : m.isQaPassed
                ? 'Marked as QA passed.'
                : 'Marked as QA failed.'}
            </p>

            {m.isQaPassed !== null && (
              <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-semibold ${m.isQaPassed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {m.isQaPassed ? '✓ QA Passed' : '✕ QA Failed'}
                {m.qaReviewedAt && <span className="block font-normal mt-0.5 text-text-tertiary">{fmt(m.qaReviewedAt)}</span>}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setQa(true)}
                disabled={!qaAllowed || savingQa || m.isQaPassed === true}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark passed
              </button>
              <button
                onClick={() => setQa(false)}
                disabled={!qaAllowed || savingQa || m.isQaPassed === false}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Mark failed
              </button>
            </div>
            {!qaAllowed && (
              <p className="mt-2 text-xs text-text-tertiary">Available once the migration finishes.</p>
            )}
            {qaError && <p className="mt-2 text-xs text-red-600">{qaError}</p>}
          </section>

          {/* Karbon mirror — status the wider team tracks in practice management */}
          {m.karbon && (
            <KarbonSyncCard
              migrationId={m.id}
              karbon={m.karbon}
              onSynced={() => load(true)}
            />
          )}

          {/* Summary */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <Row label="Customer" value={m.customer.name ?? m.customer.email ?? 'Anonymous'} />
              {m.customer.email && m.customer.name && <Row label="Email" value={m.customer.email} />}
              <Row
                label="Migration runner"
                value={
                  m.runner?.type === 'OP_TEAM'
                    ? `${m.runner.name} (Operation Team${m.runner.removed ? ', removed' : ''})`
                    : 'Guest'
                }
              />
              <Row label="Plan" value={m.plan?.name ?? '—'} />
              <Row label="Remote job" value={m.remoteJobId ?? '—'} mono />
              <Row label="Created" value={fmt(m.createdAt)} />
            </dl>
          </section>

          {/* Inquiry / contact — the lead this migration came from */}
          {m.inquiry && (
            <section className="bg-white border border-border rounded-xl shadow-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-3">Contact & inquiry</h3>
              <dl className="space-y-2.5 text-sm">
                <Row label="Name" value={m.inquiry.name} />
                <Row label="Email" value={m.inquiry.email} />
                <Row label="Phone" value={m.inquiry.phone} />
                <Row label="Country" value={m.inquiry.country} />
                <Row label="Entity" value={m.inquiry.entityName} />
                <Row label="FY end" value={m.inquiry.financialYearEnd} />
                <Row label="Add-ons" value={yesNo(m.inquiry.addOnsConfirmed)} />
                <Row label="Tracking inventory" value={yesNo(m.inquiry.trackingInventory)} />
              </dl>
            </section>
          )}

          {/* Connectors */}
          {m.connectors.length > 0 && (
            <section className="bg-white border border-border rounded-xl shadow-card p-5">
              <h3 className="text-sm font-bold text-text-primary mb-3">Connections</h3>
              <div className="space-y-3">
                {m.connectors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-text-primary">{c.side === 'SOURCE' ? 'Source' : 'Destination'}</p>
                      <p className="text-xs text-text-tertiary">{c.tenantName ?? c.platform}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">{c.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Milestone: React.FC<{ label: string; value: string; done?: boolean; danger?: boolean }> = ({ label, value, done, danger }) => (
  <div className={`rounded-lg border p-3 ${done ? (danger ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50') : 'border-border bg-bg-light'}`}>
    <p className={`text-xs font-semibold ${done ? (danger ? 'text-red-700' : 'text-green-700') : 'text-text-tertiary'}`}>{label}</p>
    <p className="text-xs text-text-secondary mt-1">{value}</p>
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-text-tertiary flex-shrink-0">{label}</dt>
    <dd className={`text-text-primary font-medium text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
  </div>
);

export default MigrationDetailPage;
