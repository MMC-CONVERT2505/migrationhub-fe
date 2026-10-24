import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  adminMigrationReviewsService,
  type MigrationReviewDetail,
  type ManualReviewTargetStatus,
} from '@/api/adminMigrationReviews';
import { ApiError } from '@/api/client';
import { reviewStatusMeta } from '@/constants/migrationReviewStatus';
import { statusMeta as migrationStatusMeta } from '@/constants/migrationStatus';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

// Mirrors the backend's state machine (migration-review-admin.service.ts) so
// the UI only ever offers a legal next action instead of round-tripping a
// guaranteed-to-fail request.
const NEXT_ACTIONS: Record<string, { status: ManualReviewTargetStatus; label: string; className: string }[]> = {
  PENDING: [
    { status: 'ACKNOWLEDGED', label: 'Acknowledge', className: 'bg-blue-600 hover:bg-blue-700' },
    { status: 'RESOLVED', label: 'Resolve', className: 'bg-green-600 hover:bg-green-700' },
    { status: 'DISMISSED', label: 'Dismiss', className: 'bg-bg-lighter hover:bg-border text-text-secondary' },
  ],
  ACKNOWLEDGED: [
    { status: 'RESOLVED', label: 'Resolve', className: 'bg-green-600 hover:bg-green-700' },
    { status: 'DISMISSED', label: 'Dismiss', className: 'bg-bg-lighter hover:bg-border text-text-secondary' },
  ],
  RESOLVED: [],
  DISMISSED: [],
};

const MigrationReviewDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [r, setR] = useState<MigrationReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [acting, setActing] = useState<ManualReviewTargetStatus | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminMigrationReviewsService.getById(id);
      setR(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load help request.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (status: ManualReviewTargetStatus) => {
    if (acting) return;
    setActing(status);
    setActionError('');
    try {
      const updated = await adminMigrationReviewsService.updateStatus(id, status, note.trim() || undefined);
      setR((prev) => (prev ? { ...prev, ...updated } : prev));
      setNote('');
    } catch (err) {
      // A 409 means another admin already moved this request — the safest
      // recovery is to reload and show them where it actually landed, not
      // just print the error over stale state.
      if (err instanceof ApiError && err.statusCode === 409) {
        setActionError(`${err.message} Refreshing…`);
        await load();
      } else {
        setActionError(err instanceof ApiError ? err.message : 'Failed to update this request.');
      }
    } finally {
      setActing(null);
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

  if (error || !r) {
    return (
      <div>
        <Link to="/admin/migration-reviews" className="text-sm text-blue-600 hover:underline">← Back to migration help requests</Link>
        <div role="alert" className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error || 'Help request not found.'}
        </div>
      </div>
    );
  }

  const meta = reviewStatusMeta(r.status);
  const mMeta = migrationStatusMeta(r.migration.status);
  const actions = NEXT_ACTIONS[r.status] ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Link to="/admin/migration-reviews" className="text-sm text-blue-600 hover:underline">← Back to migration help requests</Link>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {r.migration.migrationPair.source.toUpperCase()} → {r.migration.migrationPair.destination.toUpperCase()}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.className}`}>{meta.label}</span>
          </div>
          <p className="mt-1 text-sm text-text-secondary font-mono">
            #{r.migration.id} · {r.migration.migrationPair.displayName}
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/migrations/${r.migration.id}`)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors"
        >
          View full migration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* The request itself */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-1">Reason given</h3>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{r.reason}</p>

            {r.context && Object.keys(r.context).length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1.5">Additional context</h4>
                <pre className="text-xs bg-bg-light border border-border rounded-lg p-3 overflow-x-auto text-text-secondary">
                  {JSON.stringify(r.context, null, 2)}
                </pre>
              </div>
            )}

            <dl className="mt-4 space-y-2 text-sm border-t border-border pt-4">
              <Row label="Requested" value={fmt(r.createdAt)} />
              {r.requestedByRef && <Row label="Caller reference" value={r.requestedByRef} mono />}
              {r.resolvedAt && <Row label={r.status === 'DISMISSED' ? 'Dismissed' : 'Resolved'} value={fmt(r.resolvedAt)} />}
            </dl>
          </section>

          {/* Migration progress snapshot */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Migration status</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${mMeta.className}`}>{mMeta.label}</span>
            </div>
            <div className="h-2 bg-bg-lighter rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${r.migration.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${r.migration.progress}%` }}
              />
            </div>
            {r.migration.errorMessage && (
              <p className="mt-2 text-xs text-red-600">Error: {r.migration.errorMessage}</p>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Created" value={fmt(r.migration.createdAt)} />
              <Row label="Started" value={fmt(r.migration.startedAt)} />
              <Row label="Completed" value={fmt(r.migration.completedAt)} />
            </dl>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Action panel */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">Action</h3>
            {actions.length === 0 ? (
              <p className="text-xs text-text-secondary">
                This request is {r.status.toLowerCase()} — no further action needed.
              </p>
            ) : (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for the audit log…"
                  rows={2}
                  className="w-full mb-3 px-3 py-2 text-xs rounded-lg border border-border bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                />
                <div className="flex flex-col gap-2">
                  {actions.map((a) => (
                    <button
                      key={a.status}
                      onClick={() => act(a.status)}
                      disabled={acting !== null}
                      className={`w-full px-3 py-2 text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${a.className}`}
                    >
                      {acting === a.status ? 'Saving…' : a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {actionError && <p className="mt-2 text-xs text-red-600">{actionError}</p>}
          </section>

          {/* Migration details */}
          <section className="bg-white border border-border rounded-xl shadow-card p-5">
            <h3 className="text-sm font-bold text-text-primary mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <Row label="Migration ID" value={r.migration.id} mono />
              <Row label="Pair" value={r.migration.migrationPair.displayName} />
              <Row label="Plan" value={r.migration.plan?.name ?? '—'} />
              {r.migration.plan && (
                <Row
                  label="Plan price"
                  value={r.migration.plan.isInception ? 'Inception to date' : `${r.migration.plan.currency} ${r.migration.plan.basePrice} (default)${r.migration.plan.years ? ` · ${r.migration.plan.years}y` : ''}`}
                />
              )}
              <Row label="Customer" value={r.migration.customer.name ?? r.migration.customer.email ?? 'Anonymous'} />
              {r.migration.customer.email && r.migration.customer.name && (
                <Row label="Email" value={r.migration.customer.email} />
              )}
              {r.migration.customer.entityName && <Row label="Entity" value={r.migration.customer.entityName} />}
            </dl>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-text-secondary flex-shrink-0">{label}</dt>
    <dd className={`text-text-primary font-medium text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
  </div>
);

export default MigrationReviewDetailPage;
