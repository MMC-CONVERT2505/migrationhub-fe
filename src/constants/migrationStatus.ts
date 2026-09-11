import type { MigrationStatus } from '@/api/adminMigrations';

export const STATUS_META: Record<MigrationStatus, { label: string; className: string }> = {
  DRAFT:                      { label: 'Draft',              className: 'bg-bg-light text-text-secondary border border-border' },
  PAYMENT_PENDING:            { label: 'Payment pending',    className: 'bg-yellow-50 text-yellow-700' },
  PAYMENT_FAILED:             { label: 'Payment failed',     className: 'bg-red-50 text-red-700' },
  SOURCE_AUTH_PENDING:        { label: 'Source auth',        className: 'bg-blue-50 text-blue-700' },
  SOURCE_AUTH_AWAITING:       { label: 'Source auth',        className: 'bg-blue-50 text-blue-700' },
  SOURCE_AUTH_COMPLETED:      { label: 'Source authed',      className: 'bg-blue-50 text-blue-700' },
  DESTINATION_AUTH_PENDING:   { label: 'Dest. auth',         className: 'bg-blue-50 text-blue-700' },
  DESTINATION_AUTH_AWAITING:  { label: 'Dest. auth',         className: 'bg-blue-50 text-blue-700' },
  DESTINATION_AUTH_COMPLETED: { label: 'Dest. authed',       className: 'bg-blue-50 text-blue-700' },
  DATA_COUNT_PENDING:         { label: 'Counting data',      className: 'bg-blue-50 text-blue-700' },
  DATA_COUNT_READY:           { label: 'Data counted',       className: 'bg-blue-50 text-blue-700' },
  SUBMITTING:                 { label: 'Submitting',         className: 'bg-indigo-50 text-indigo-700' },
  QUEUED:                     { label: 'Queued',             className: 'bg-indigo-50 text-indigo-700' },
  RUNNING:                    { label: 'Running',            className: 'bg-indigo-50 text-indigo-700' },
  PARTIAL_SUCCESS:            { label: 'Partial success',    className: 'bg-yellow-50 text-yellow-700' },
  UNDER_REVIEW:               { label: 'Under review',       className: 'bg-orange-50 text-orange-700' },
  COMPLETED:                  { label: 'Completed',          className: 'bg-green-50 text-green-700' },
  FAILED:                     { label: 'Failed',             className: 'bg-red-50 text-red-700' },
  CANCELLED:                  { label: 'Cancelled',          className: 'bg-red-50 text-red-700' },
};

export const statusMeta = (s: MigrationStatus) =>
  STATUS_META[s] ?? { label: s, className: 'bg-bg-light text-text-secondary' };

const TERMINAL: MigrationStatus[] = ['COMPLETED', 'PARTIAL_SUCCESS', 'UNDER_REVIEW', 'FAILED', 'CANCELLED'];
export const isTerminal = (s: MigrationStatus) => TERMINAL.includes(s);

const QA_ALLOWED: MigrationStatus[] = ['COMPLETED', 'PARTIAL_SUCCESS', 'UNDER_REVIEW', 'FAILED'];
export const isQaAllowed = (s: MigrationStatus) => QA_ALLOWED.includes(s);
