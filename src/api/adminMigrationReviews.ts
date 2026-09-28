import { apiClient } from './client';
import type { MigrationStatus, MigrationCustomer } from './adminMigrations';

export type ReviewRequestStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export type ManualReviewTargetStatus = 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
export type MigrationReviewTab = 'all' | 'open' | 'resolved';

interface ReviewPairSummary {
  source: string;
  destination: string;
  displayName: string;
}

export interface MigrationReviewGroupItem {
  migrationId: string;
  migrationStatus: MigrationStatus | null;
  migrationPair: ReviewPairSummary | null;
  planName: string | null;
  requestCount: number;
  openCount: number;
  latestRequest: {
    id: string;
    status: ReviewRequestStatus;
    reason: string;
    createdAt: string;
  };
}

export interface MigrationReviewGroupResponse {
  data: MigrationReviewGroupItem[];
  total: number;
  skip: number;
  take: number;
}

export interface MigrationReviewListItem {
  id: string;
  migrationId: string;
  migrationPairId: string;
  status: ReviewRequestStatus;
  reason: string;
  context: Record<string, unknown> | null;
  requestedByRef: string | null;
  notifiedAt: string | null;
  emailQueuedAt: string | null;
  emailFailureReason: string | null;
  resolvedAt: string | null;
  resolvedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationReviewDetail extends MigrationReviewListItem {
  migration: {
    id: string;
    status: MigrationStatus;
    progress: number;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    errorMessage: string | null;
    migrationPair: ReviewPairSummary;
    plan: {
      name: string;
      basePrice: string;
      currency: string;
      years: number | null;
      isInception: boolean;
    } | null;
    customer: MigrationCustomer;
  };
}

export interface ListMigrationReviewsParams {
  tab?: MigrationReviewTab;
  search?: string;
  skip?: number;
  take?: number;
}

export const adminMigrationReviewsService = {
  listGrouped: (params?: ListMigrationReviewsParams) =>
    apiClient
      .get<MigrationReviewGroupResponse>('/admin/migration-reviews', { params })
      .then((r) => r.data),

  listForMigration: (migrationId: string) =>
    apiClient
      .get<MigrationReviewListItem[]>(`/admin/migration-reviews/migration/${migrationId}`)
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<MigrationReviewDetail>(`/admin/migration-reviews/${id}`)
      .then((r) => r.data),

  updateStatus: (id: string, status: ManualReviewTargetStatus, note?: string) =>
    apiClient
      .patch<MigrationReviewListItem>(`/admin/migration-reviews/${id}`, { status, note })
      .then((r) => r.data),
};
