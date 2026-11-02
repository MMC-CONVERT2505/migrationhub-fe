import { describe, expect, it } from 'vitest';
import { historyBucket, isLiveStatus, statusRank } from '../migrationHistory';

describe('historyBucket', () => {
  it('keeps the existing groupings', () => {
    expect(historyBucket('RUNNING')).toBe('active');
    expect(historyBucket('QUEUED')).toBe('active');
    expect(historyBucket('DRAFT')).toBe('drafts');
    expect(historyBucket('COMPLETED')).toBe('completed');
    expect(historyBucket('UNDER_REVIEW')).toBe('completed');
    expect(historyBucket('FAILED')).toBe('failed');
    expect(historyBucket('CANCELLED')).toBe('failed');
  });

  it('shows the statuses that used to be hidden', () => {
    expect(historyBucket('PARTIAL_SUCCESS')).toBe('completed');
    expect(historyBucket('PAYMENT_FAILED')).toBe('failed');
    expect(historyBucket('PAYMENT_PENDING')).toBe('drafts');
    expect(historyBucket('SUBMITTING')).toBe('active');
    expect(historyBucket('SOURCE_AUTH_AWAITING')).toBe('active');
    expect(historyBucket('DATA_COUNT_READY')).toBe('active');
  });

  it('never hides a status it has not heard of', () => {
    expect(historyBucket('SOMETHING_NEW')).toBe('active');
  });
});

describe('isLiveStatus / statusRank', () => {
  it('treats only in-flight statuses as live', () => {
    expect(isLiveStatus('SUBMITTING')).toBe(true);
    expect(isLiveStatus('DRAFT')).toBe(false);
    expect(isLiveStatus('COMPLETED')).toBe(false);
  });

  it('ranks unknown statuses without throwing', () => {
    expect(statusRank('SOMETHING_NEW')).toBe(0);
    expect(statusRank('COMPLETED')).toBeGreaterThan(statusRank('RUNNING'));
  });
});
