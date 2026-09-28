import type { ReviewRequestStatus } from '@/api/adminMigrationReviews';

export const REVIEW_STATUS_META: Record<ReviewRequestStatus, { label: string; className: string }> = {
  PENDING:      { label: 'Pending',      className: 'bg-yellow-50 text-yellow-700' },
  ACKNOWLEDGED: { label: 'Acknowledged', className: 'bg-blue-50 text-blue-700' },
  RESOLVED:     { label: 'Resolved',     className: 'bg-green-50 text-green-700' },
  DISMISSED:    { label: 'Dismissed',    className: 'bg-bg-light text-text-secondary border border-border' },
};

export const reviewStatusMeta = (s: ReviewRequestStatus) =>
  REVIEW_STATUS_META[s] ?? { label: s, className: 'bg-bg-light text-text-secondary' };

const OPEN: ReviewRequestStatus[] = ['PENDING', 'ACKNOWLEDGED'];
export const isReviewOpen = (s: ReviewRequestStatus) => OPEN.includes(s);
