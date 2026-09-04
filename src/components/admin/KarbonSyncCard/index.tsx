import React, { useState } from 'react';
import { adminKarbonService, type KarbonMigrationView } from '@/api/adminKarbon';
import { ApiError } from '@/api/client';
import { karbonPrimaryMeta, karbonSyncMeta } from '@/constants/karbonStatus';

interface KarbonSyncCardProps {
  migrationId: string;
  karbon: KarbonMigrationView;
  /** Called after a manual sync so the parent can refresh the migration. */
  onSynced?: () => void;
}

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString('en-AU', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

/**
 * Karbon mirror state for one migration. Shows what Karbon actually holds
 * against what it should hold, so a silent sync failure is visible here rather
 * than only discoverable by opening Karbon.
 */
export const KarbonSyncCard: React.FC<KarbonSyncCardProps> = ({
  migrationId,
  karbon,
  onSynced,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const workItem = karbon?.workItem ?? null;
  const expected = karbon?.expected ?? null;
  const expectedMeta = karbonPrimaryMeta(expected?.primaryStatus);
  const actualMeta = karbonPrimaryMeta(workItem?.primaryStatus);
  const syncMeta = karbonSyncMeta(workItem?.syncStatus);
  const drifted = Boolean(workItem) && !workItem!.inSync;

  const sync = async () => {
    if (syncing) return;
    setSyncing(true);
    setError('');
    setNotice('');
    try {
      const res = await adminKarbonService.sync(migrationId);
      setNotice(
        res.result === 'skipped'
          ? (res.reason ?? 'Sync skipped.')
          : `Work item ${res.result}.`,
      );
      onSynced?.();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to sync with Karbon.',
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <section className="bg-white border border-border rounded-xl shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Karbon</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Practice-management work item
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${syncMeta.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${syncMeta.dot}`} />
          {syncMeta.label}
        </span>
      </div>

      {!workItem ? (
        <p className="text-xs text-text-tertiary mb-3">
          No Karbon work item yet for this migration.
        </p>
      ) : (
        <dl className="space-y-2.5 text-sm mb-3">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-tertiary flex-shrink-0">Karbon status</dt>
            <dd className="text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actualMeta.className}`}
              >
                {actualMeta.label}
              </span>
            </dd>
          </div>

          {drifted && expected && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-text-tertiary flex-shrink-0">Should be</dt>
              <dd className="text-right">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${expectedMeta.className}`}
                >
                  {expectedMeta.label}
                </span>
              </dd>
            </div>
          )}

          <Row label="Stage" value={workItem.secondaryStatus ?? '—'} />
          <Row label="Work type" value={workItem.workType ?? '—'} />
          <Row label="Assignee" value={workItem.assigneeEmail ?? '—'} />
          <Row label="Last synced" value={fmt(workItem.lastSyncedAt)} />
          {workItem.attemptCount > 0 && (
            <Row label="Failed attempts" value={String(workItem.attemptCount)} />
          )}
          <div className="flex items-start justify-between gap-3">
            <dt className="text-text-tertiary flex-shrink-0">Work item</dt>
            <dd className="text-right font-mono text-xs break-all">
              {workItem.workItemUrl && workItem.workItemKey ? (
                <a
                  href={workItem.workItemUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {workItem.workItemKey}
                </a>
              ) : (
                (workItem.workItemKey ?? '—')
              )}
            </dd>
          </div>
        </dl>
      )}

      {drifted && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 text-xs">
          Karbon is behind this migration's current status. It re-syncs
          automatically within a few minutes, or sync now.
        </p>
      )}

      {workItem?.lastError && (
        <p className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs break-words">
          {workItem.lastError}
        </p>
      )}

      <button
        onClick={sync}
        disabled={syncing}
        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {syncing ? 'Syncing…' : workItem ? 'Sync now' : 'Create in Karbon'}
      </button>

      {notice && <p className="mt-2 text-xs text-green-700">{notice}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {workItem?.logs && workItem.logs.length > 0 && (
        <details className="mt-4 border-t border-border pt-3 group">
          <summary className="text-xs font-semibold text-text-secondary cursor-pointer select-none hover:text-text-primary">
            Sync history ({workItem.logs.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {workItem.logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2">
                <span
                  className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.success ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-text-primary">
                    {log.operation === 'CREATE' ? 'Created' : 'Updated'}
                    {log.primaryStatus ? ` → ${log.primaryStatus}` : ''}
                    {log.httpStatus ? ` · ${log.httpStatus}` : ''}
                  </p>
                  {log.errorMessage && (
                    <p className="text-[11px] text-red-600 break-words">
                      {log.errorMessage}
                    </p>
                  )}
                  <p className="text-[11px] text-text-tertiary">
                    {fmt(log.createdAt)}
                    {log.durationMs !== null ? ` · ${log.durationMs}ms` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-text-tertiary flex-shrink-0">{label}</dt>
    <dd className="text-text-primary font-medium text-right break-all">
      {value}
    </dd>
  </div>
);

export default KarbonSyncCard;
