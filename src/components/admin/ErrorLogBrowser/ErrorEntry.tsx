import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminErrorLogsService, type ErrorLogDetail, type ErrorLogEntry } from '@/api/adminErrorLogs';
import { ApiError } from '@/api/client';
import { Badge, CATEGORY_META, SEVERITY_META, fmt } from './shared';

interface ErrorEntryProps {
  entry: ErrorLogEntry;
  /** Hide the migration link — set when the list is already scoped to that migration. */
  hideMigration?: boolean;
  /** Hide the function id — set when it is already shown by a heading above. */
  hideFunction?: boolean;
}

/** One error: a summary row that opens into its context and (for developers) raw exception. */
export const ErrorEntry: React.FC<ErrorEntryProps> = ({ entry: e, hideMigration, hideFunction }) => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
  const [detailError, setDetailError] = useState('');

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (detail) return;
    setDetailError('');
    try {
      setDetail(await adminErrorLogsService.detail(e.id));
    } catch (err) {
      setDetailError(
        err instanceof ApiError && err.statusCode === 403
          ? 'The raw exception is restricted to developers (system.read).'
          : 'Could not load the exception detail.',
      );
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full text-left px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        <span className="text-[11px] text-text-secondary w-28 flex-shrink-0">{fmt(e.occurredAt)}</span>
        <Badge className={SEVERITY_META[e.severity]}>{e.severity}</Badge>
        <Badge className={CATEGORY_META[e.category]}>{e.category}</Badge>
        {!hideFunction && <span className="text-xs font-mono text-text-secondary">{e.functionId}</span>}
        {e.recordRef && <span className="text-[11px] text-text-secondary font-mono break-all">{e.recordRef}</span>}
        {e.retryable && <Badge className="bg-gray-100 text-text-secondary">retryable</Badge>}
        {!hideMigration && (
          <span className="ml-auto text-[11px] text-text-secondary">
            {e.migrationUnmatched ? (
              <span title="No migration in the hub has this id">⚠ {e.migrationId}</span>
            ) : (
              <Link
                to={`/admin/migrations/${encodeURIComponent(e.migrationId)}`}
                onClick={(ev) => ev.stopPropagation()}
                className="text-blue-600 hover:underline"
              >
                Migration {e.migrationId}
              </Link>
            )}
          </span>
        )}
        <span className="w-full text-xs text-text-primary break-words">{e.message}</span>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div><dt className="text-text-secondary">Event ID</dt><dd className="font-mono break-all">{e.eventId}</dd></div>
            <div><dt className="text-text-secondary">Error code</dt><dd className="font-mono break-all">{e.errorCode ?? '—'}</dd></div>
            <div><dt className="text-text-secondary">Occurred</dt><dd>{fmt(e.occurredAt)}</dd></div>
            <div><dt className="text-text-secondary">Received</dt><dd>{fmt(e.receivedAt)}</dd></div>
          </dl>
          {e.context && (
            <div>
              <p className="text-[11px] font-semibold text-text-secondary mb-1">Context</p>
              <pre className="text-[11px] bg-bg-light border border-border rounded-md p-2 overflow-x-auto max-h-48">
                {JSON.stringify(e.context, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p className="text-[11px] font-semibold text-text-secondary mb-1">Raw exception</p>
            {detailError ? (
              <p className="text-xs text-text-secondary">{detailError}</p>
            ) : !detail ? (
              <p className="text-xs text-text-secondary">Loading…</p>
            ) : detail.rawException ? (
              <pre className="text-[11px] bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto max-h-72 whitespace-pre-wrap break-words">
                {detail.rawException}
              </pre>
            ) : (
              <p className="text-xs text-text-secondary">The tool did not send one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
