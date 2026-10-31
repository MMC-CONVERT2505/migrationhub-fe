import { apiClient } from './client';
import type { MigrationStatus, OrderSource } from './adminMigrations';
import { chunk } from '@/utils/cleanerSelection';

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

/** Who ran a migration: an Operation Team member, a Developer, or otherwise the customer. */
export interface CleanerRunner {
  type: 'OP_TEAM' | 'DEVELOPER' | 'CUSTOMER';
  role: string | null;
  name: string | null;
  email: string | null;
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
  runner: CleanerRunner;
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
  /** Forced only: the safety rules that are being ignored for this row. */
  overridden?: string[];
  counts: RemovalCounts;
}

export interface CleanerPreview {
  action: CleanerAction;
  eligible: number;
  refused: number;
  force?: boolean;
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

const PHRASE_VERB: Record<CleanerAction, string> = {
  PURGE: 'PURGE',
  SOFT_DELETE: 'SOFT DELETE',
  HARD_DELETE: 'HARD DELETE',
  RESTORE: 'RESTORE',
};

export const migrationCleanerService = {
  search: (params: CleanerSearchParams, signal?: AbortSignal) =>
    apiClient
      .get<CleanerSearchResponse>('/admin/migration-cleaner/search', { params, signal })
      .then((r) => r.data),

  /** Every id the filter matches that `action` may run on (the server caps it). */
  matchingIds: (params: CleanerSearchParams & { action: CleanerAction; force?: boolean }) =>
    apiClient
      .get<{ ids: string[]; matched: number; capped: boolean; cap: number }>(
        '/admin/migration-cleaner/matching-ids',
        { params },
      )
      .then((r) => r.data),

  preview: (ids: string[], action: CleanerAction, force = false) =>
    apiClient
      .post<CleanerPreview>('/admin/migration-cleaner/preview', { ids, action, ...(force && { force }) })
      .then((r) => r.data),

  /** `confirm` is required for PURGE and HARD_DELETE only. */
  execute: (ids: string[], action: CleanerAction, confirm?: string, force = false) =>
    apiClient
      .post<CleanerExecuteResponse>('/admin/migration-cleaner/execute', { ids, action, confirm, ...(force && { force }) })
      .then((r) => r.data),

  /** A dry run over any number of ids: sent in batches the server accepts, then joined. */
  previewMany: async (ids: string[], action: CleanerAction, force = false): Promise<CleanerPreview> => {
    const parts = await Promise.all(chunk(ids).map((b) => migrationCleanerService.preview(b, action, force)));
    const items = parts.flatMap((p) => p.items);
    const eligible = items.filter((i) => i.eligible).length;
    return {
      action,
      eligible,
      refused: items.length - eligible,
      force,
      confirmationPhrase: `${force ? 'FORCE ' : ''}${PHRASE_VERB[action]} ${items.length}`,
      items,
    };
  },

  /**
   * Runs any number of ids in batches of 200, one after another. Each batch gets its own confirmation
   * (the server checks it against that batch's count). If a batch cannot be sent, the rest are not
   * attempted and every id says so, so nothing is silently dropped.
   */
  executeMany: async (ids: string[], action: CleanerAction, force = false): Promise<CleanerExecuteResponse> => {
    const results: CleanerResult[] = [];
    let stopped = '';
    for (const batch of chunk(ids)) {
      if (stopped) {
        results.push(...batch.map((id) => ({ id, outcome: 'skipped' as const, reasons: [stopped] })));
        continue;
      }
      try {
        const confirm = action === 'PURGE' || action === 'HARD_DELETE'
          ? `${force ? 'FORCE ' : ''}${PHRASE_VERB[action]} ${batch.length}`
          : undefined;
        results.push(...(await migrationCleanerService.execute(batch, action, confirm, force)).results);
      } catch {
        stopped = 'Not attempted: an earlier batch could not be sent. Check Recent removals before trying again.';
        results.push(...batch.map((id) => ({ id, outcome: 'failed' as const, reasons: ['The request failed. Check Recent removals to see whether it went through.'] })));
      }
    }
    const summary: Record<CleanerOutcome, number> = { purged: 0, soft_deleted: 0, restored: 0, deleted: 0, skipped: 0, failed: 0 };
    for (const r of results) summary[r.outcome]++;
    return { action, results, summary };
  },

  history: (skip = 0, take = 30) =>
    apiClient
      .get<{ data: CleanupLogEntry[]; total: number }>('/admin/migration-cleaner/history', {
        params: { skip, take },
      })
      .then((r) => r.data),
};
