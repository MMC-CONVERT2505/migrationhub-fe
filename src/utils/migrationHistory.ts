export type HistoryBucket = 'active' | 'drafts' | 'completed' | 'failed';

/** Every status the backend can send. A status not listed here lands in "active", so a migration is never hidden. */
const BUCKET_BY_STATUS: Record<string, HistoryBucket> = {
  DRAFT: 'drafts',
  PAYMENT_PENDING: 'drafts',
  PAYMENT_FAILED: 'failed',
  SOURCE_AUTH_PENDING: 'active',
  SOURCE_AUTH_AWAITING: 'active',
  SOURCE_AUTH_COMPLETED: 'active',
  DESTINATION_AUTH_PENDING: 'active',
  DESTINATION_AUTH_AWAITING: 'active',
  DESTINATION_AUTH_COMPLETED: 'active',
  DATA_COUNT_PENDING: 'active',
  DATA_COUNT_READY: 'active',
  SUBMITTING: 'active',
  QUEUED: 'active',
  RUNNING: 'active',
  PARTIAL_SUCCESS: 'completed',
  UNDER_REVIEW: 'completed',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'failed',
};

export const historyBucket = (status: string): HistoryBucket => BUCKET_BY_STATUS[status] ?? 'active';

/** Still moving, so the customer can follow it live on the tracking page. */
export const isLiveStatus = (status: string): boolean => historyBucket(status) === 'active';

const ORDER = ['RUNNING', 'QUEUED', 'DRAFT', 'FAILED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'];

/** Position within a section; statuses without a place in the list sort first. */
export const statusRank = (status: string): number => Math.max(ORDER.indexOf(status), 0);
