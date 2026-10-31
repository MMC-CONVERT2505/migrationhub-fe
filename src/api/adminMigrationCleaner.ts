import { apiClient } from './client';
import type { MigrationStatus, OrderSource } from './adminMigrations';

export type CleanerAction = 'PURGE' | 'SOFT_DELETE' | 'HARD_DELETE' | 'RESTORE';
export type CleanerGroup = 'active' | 'completed' | 'failed' | 'deleted';

export interface RemovalCounts {
  logs: number;
  webhookEvents: number;
  outboundCalls: number;
  connectors: number;
  dataCount: number;
  reviewRequests: number;
}

export interface CleanerRow {
  id: string;
  status: MigrationStatus;
  createdAt: string;
  updatedAt: string;
  orderSource: OrderSource;
  dataPurgedAt: string | null;
  /** Set while soft-deleted: hidden from customers, lists and the numbers, and restorable. */
  deletedAt: string | null;
  pair: string;
  customer: string | null;
  email: string | null;
  entity: string | null;
  runner: { name: string; role: string | null } | null;
  /** What each action may do to this row right now, and why not. */
  can: Record<CleanerAction, boolean>;
  blockedBy: Record<CleanerAction, string[]>;
}

export interface CleanerSearchResponse {
  data: CleanerRow[];
  total: number;
  skip: number;
  take: number;
}

export interface CleanerSearchParams {
  search?: string;
  group?: CleanerGroup;
  orderSource?: OrderSource;
  skip?: number;
  take?: number;
}

export interface CleanerPreviewItem {
  id: string;
  status: MigrationStatus | null;
  eligible: boolean;
  reasons: string[];
  counts: RemovalCounts;
}

export interface CleanerPreview {
  action: CleanerAction;
  eligible: number;
  refused: number;
  confirmationPhrase: string;
  items: CleanerPreviewItem[];
}

export type CleanerOutcome =
  | 'purged'
  | 'soft_deleted'
  | 'restored'
  | 'deleted'
  | 'skipped'
  | 'failed';

export interface CleanerResult {
  id: string;
  outcome: CleanerOutcome;
  reasons: string[];
  counts?: RemovalCounts;
}

export interface CleanerExecuteResponse {
  action: CleanerAction;
  results: CleanerResult[];
  summary: Record<CleanerOutcome, number>;
}

export interface CleanupLogEntry {
  id: string;
  migrationId: string;
  action: 'PURGE_DATA' | 'SOFT_DELETE' | 'RESTORE' | 'DELETE_MIGRATION';
  performedBy: number;
  performedByType: 'admin' | 'user';
  statusAtTime: string;
  pairName: string | null;
  customerEmail: string | null;
  counts: RemovalCounts;
  createdAt: string;
}

export const migrationCleanerService = {
  search: (params: CleanerSearchParams, signal?: AbortSignal) =>
    apiClient
      .get<CleanerSearchResponse>('/admin/migration-cleaner/search', { params, signal })
      .then((r) => r.data),

  /** Every id the filter matches that `action` may run on (the server caps it). */
  matchingIds: (params: CleanerSearchParams & { action: CleanerAction }) =>
    apiClient
      .get<{ ids: string[]; matched: number; capped: boolean; cap: number }>(
        '/admin/migration-cleaner/matching-ids',
        { params },
      )
      .then((r) => r.data),

  preview: (ids: string[], action: CleanerAction) =>
    apiClient
      .post<CleanerPreview>('/admin/migration-cleaner/preview', { ids, action })
      .then((r) => r.data),

  /** `confirm` is required for PURGE and HARD_DELETE only. */
  execute: (ids: string[], action: CleanerAction, confirm?: string) =>
    apiClient
      .post<CleanerExecuteResponse>('/admin/migration-cleaner/execute', { ids, action, confirm })
      .then((r) => r.data),

  history: (skip = 0, take = 30) =>
    apiClient
      .get<{ data: CleanupLogEntry[]; total: number }>('/admin/migration-cleaner/history', {
        params: { skip, take },
      })
      .then((r) => r.data),
};
