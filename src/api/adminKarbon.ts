import { apiClient } from './client';

export type KarbonSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'DISABLED';
export type KarbonSyncOperation = 'CREATE' | 'UPDATE';

/** Karbon's own PrimaryStatus enum. */
export type KarbonPrimaryStatus =
  | 'Planned'
  | 'ReadyToStart'
  | 'InProgress'
  | 'Waiting'
  | 'Completed';

export interface KarbonSyncLog {
  id: string;
  operation: KarbonSyncOperation;
  success: boolean;
  httpStatus: number | null;
  primaryStatus: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
}

export interface KarbonWorkItem {
  id: string;
  migrationId: string;
  workItemKey: string | null;
  clientKey: string | null;
  clientType: string | null;
  workType: string | null;
  title: string | null;
  primaryStatus: string | null;
  secondaryStatus: string | null;
  assigneeEmail: string | null;
  syncStatus: KarbonSyncStatus;
  attemptCount: number;
  lastSyncedAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  /** Deep link into Karbon, computed server-side. */
  workItemUrl: string | null;
  /** True when Karbon already holds the status the migration is actually in. */
  inSync: boolean;
  logs?: KarbonSyncLog[];
}

/** What Karbon *should* hold for the migration's current status. */
export interface KarbonExpectedStatus {
  primaryStatus: KarbonPrimaryStatus;
  /** null when that PrimaryStatus has no secondary status configured in Karbon. */
  secondaryStatus: string | null;
  stageLabel: string;
}

/** Shape embedded on the admin migration detail response. */
export interface KarbonMigrationView {
  expected: KarbonExpectedStatus;
  workItem: KarbonWorkItem | null;
}

/** Light shape on admin migration list rows. */
export interface KarbonWorkItemSummary {
  workItemKey: string | null;
  primaryStatus: string | null;
  syncStatus: KarbonSyncStatus;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface KarbonState extends KarbonMigrationView {
  enabled: boolean;
  migrationId: string;
  migrationStatus: string;
}

export interface KarbonHealth {
  enabled: boolean;
  configured: {
    applicationId: boolean;
    accessKey: boolean;
    assigneeEmail: boolean;
    defaultClientKey: boolean;
    workTemplateKey: boolean;
  };
  baseUrl: string;
  assigneeEmail: string | null;
  clientType: string;
  feeType: string;
  dueHours: number;
  clientLookupEnabled: boolean;
  reconcileEnabled: boolean;
  workTypeOverrides: Record<string, string>;
}

export interface KarbonSyncResult {
  result: 'created' | 'updated' | 'unchanged' | 'skipped';
  workItemKey?: string | null;
  reason?: string;
  state: KarbonState;
}

export const adminKarbonService = {
  health: () =>
    apiClient.get<KarbonHealth>('/admin/karbon/health').then((r) => r.data),

  getState: (migrationId: string) =>
    apiClient
      .get<KarbonState>(`/admin/karbon/migrations/${migrationId}`)
      .then((r) => r.data),

  sync: (migrationId: string) =>
    apiClient
      .post<KarbonSyncResult>(`/admin/karbon/migrations/${migrationId}/sync`)
      .then((r) => r.data),
};
