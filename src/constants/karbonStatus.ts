import type {
  KarbonPrimaryStatus,
  KarbonSyncStatus,
} from '@/api/adminKarbon';

/** Karbon's PrimaryStatus, as shown in the admin panel. */
export const KARBON_PRIMARY_META: Record<
  KarbonPrimaryStatus,
  { label: string; className: string }
> = {
  Planned:      { label: 'Planned',        className: 'bg-bg-light text-text-secondary border border-border' },
  ReadyToStart: { label: 'Ready to start', className: 'bg-blue-50 text-blue-700' },
  InProgress:   { label: 'In progress',    className: 'bg-indigo-50 text-indigo-700' },
  Waiting:      { label: 'Waiting',        className: 'bg-amber-50 text-amber-700' },
  Completed:    { label: 'Completed',      className: 'bg-green-50 text-green-700' },
};

export const karbonPrimaryMeta = (
  status?: string | null,
): { label: string; className: string } =>
  KARBON_PRIMARY_META[status as KarbonPrimaryStatus] ?? {
    label: status || 'Not set',
    className: 'bg-bg-light text-text-secondary border border-border',
  };

/** Whether our last push to Karbon actually landed. */
export const KARBON_SYNC_META: Record<
  KarbonSyncStatus,
  { label: string; className: string; dot: string }
> = {
  SYNCED:   { label: 'Synced',   className: 'bg-green-50 text-green-700',      dot: 'bg-green-500' },
  PENDING:  { label: 'Pending',  className: 'bg-blue-50 text-blue-700',        dot: 'bg-blue-500' },
  FAILED:   { label: 'Failed',   className: 'bg-red-50 text-red-700',          dot: 'bg-red-500' },
  DISABLED: { label: 'Disabled', className: 'bg-bg-light text-text-secondary', dot: 'bg-text-tertiary' },
};

export const karbonSyncMeta = (
  status?: KarbonSyncStatus | null,
): { label: string; className: string; dot: string } =>
  (status ? KARBON_SYNC_META[status] : undefined) ?? {
    label: 'Not synced',
    className: 'bg-bg-light text-text-secondary',
    dot: 'bg-text-tertiary',
  };
