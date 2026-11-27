import { apiClient } from './client';
import type { ReviewRequestStatus } from './adminMigrationReviews';

export interface HelpRequestRow {
  id: string;
  migrationId: string;
  status: ReviewRequestStatus;
  reason: string | null;
  createdAt: string;
  resolvedAt: string | null;
  pair: string;
  customer: string | null;
  email: string | null;
  isOpen: boolean;
}

export interface HelpDeleteResult {
  id: string;
  outcome: 'deleted' | 'skipped' | 'failed';
  reasons: string[];
}

export interface HelpDeleteResponse {
  results: HelpDeleteResult[];
  summary: Record<HelpDeleteResult['outcome'], number>;
}

export interface HelpCleanupLogEntry {
  id: string;
  requestId: string;
  migrationId: string;
  statusAtTime: string;
  forced: boolean;
  pairName: string | null;
  customerEmail: string | null;
  performedBy: number;
  performedByType: 'admin' | 'user';
  createdAt: string;
}

/** Most requests one delete may carry (the server enforces it). */
export const HELP_DELETE_LIMIT = 100;

/** What to type to confirm, exactly as the server expects. */
export const helpDeletePhrase = (count: number, includeOpen = false) =>
  `${includeOpen ? 'FORCE ' : ''}HARD DELETE ${count}`;

export const helpRequestCleanerService = {
  search: (params: { search?: string; state?: 'open' | 'closed'; skip?: number; take?: number }) =>
    apiClient
      .get<{ data: HelpRequestRow[]; total: number }>('/admin/help-request-cleaner/search', { params })
      .then((r) => r.data),

  history: (skip = 0, take = 10) =>
    apiClient
      .get<{ data: HelpCleanupLogEntry[]; total: number }>('/admin/help-request-cleaner/history', {
        params: { skip, take },
      })
      .then((r) => r.data),

  delete: (ids: string[], confirm: string, includeOpen = false) =>
    apiClient
      .post<HelpDeleteResponse>('/admin/help-request-cleaner/delete', {
        ids,
        confirm,
        ...(includeOpen && { includeOpen }),
      })
      .then((r) => r.data),
};
