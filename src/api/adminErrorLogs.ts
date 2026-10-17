import { apiClient } from './client';

export type ErrorCategory = 'DATA' | 'API' | 'AUTH' | 'TECH' | 'INFRA';
export type ErrorSeverity = 'WARN' | 'ERROR' | 'CRITICAL';
export type ErrorGroupStatus = 'OPEN' | 'RESOLVED' | 'MUTED';

/** One migration-pair tool (a pair), with its error totals. */
export interface ErrorTool {
  id: string;
  /** source_to_destination, e.g. qbo_to_xero — what the tool sends in X-MMC-Tool. */
  code: string;
  displayName: string;
  environment: string;
  groups: number;
  openGroups: number;
  errors: number;
  lastErrorAt: string | null;
}

export interface ErrorGroup {
  id: string;
  fingerprint: string;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  sampleMessage: string;
  status: ErrorGroupStatus;
  migrationPair: { id: string; code: string } | null;
  /** The most recent error in the group. */
  latest: {
    functionId: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    errorCode: string | null;
    retryable: boolean;
  } | null;
}

export interface ErrorLogEntry {
  id: string;
  eventId: string;
  migrationPairCode: string;
  migrationId: string;
  migrationUnmatched: boolean;
  functionId: string;
  recordRef: string | null;
  category: ErrorCategory;
  severity: ErrorSeverity;
  errorCode: string | null;
  message: string;
  context: Record<string, unknown> | null;
  retryable: boolean;
  status: string;
  occurredAt: string;
  receivedAt: string;
}

/** Developer detail — the only shape that carries the tool's raw exception. */
export interface ErrorLogDetail extends ErrorLogEntry {
  rawException: string | null;
}

/** One error as listed by `/admin/errors/logs`: an entry plus its module and cause status. */
export interface ErrorLogRow extends ErrorLogEntry {
  module: string;
  groupStatus: ErrorGroupStatus;
}

/** One function (the failing "file") with its error totals — drives the module → function view. */
export interface ErrorFunctionSummary {
  functionId: string;
  module: string;
  errors: number;
  /** Distinct causes (error groups) among them. */
  groups: number;
  lastErrorAt: string | null;
  severities: Record<ErrorSeverity, number>;
}

/** One migration that has errors — a row of the "By migration" view. */
export interface ErrorMigrationSummary {
  migrationId: string;
  errors: number;
  /** Distinct causes (error groups) among them. */
  causes: number;
  lastErrorAt: string | null;
  severities: Record<ErrorSeverity, number>;
  /** The tool(s) that reported them, e.g. qbo_to_xero. */
  pairCodes: string[];
  /** No migration in the hub carries this id. */
  unmatched: boolean;
  /** The hub migration's current status, null when unmatched. */
  hubStatus: string | null;
}

interface Paged<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export interface ListErrorGroupsParams {
  migration_pair?: string;
  status?: ErrorGroupStatus;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  search?: string;
  /** Only errors of this MigrationHub migration id. */
  migration_id?: string;
  /** Exact function id, e.g. customers.push. */
  function_id?: string;
  /** Module: the function id up to its first dot. */
  module?: string;
  /** Error list order; `function` sorts by function id, then newest. */
  sort?: 'recent' | 'function';
  skip?: number;
  take?: number;
}

export const adminErrorLogsService = {
  tools: () =>
    apiClient.get<ErrorTool[]>('/admin/errors/tools').then((r) => r.data),

  groups: (params?: ListErrorGroupsParams) =>
    apiClient
      .get<Paged<ErrorGroup>>('/admin/errors/groups', { params })
      .then((r) => r.data),

  functions: (params?: Omit<ListErrorGroupsParams, 'skip' | 'take' | 'sort'>) =>
    apiClient
      .get<{ data: ErrorFunctionSummary[]; total: number }>('/admin/errors/functions', { params })
      .then((r) => r.data),

  /** Migrations that have errors, newest first; `migration_id` is a prefix search here. */
  migrations: (params?: Omit<ListErrorGroupsParams, 'sort'>) =>
    apiClient
      .get<Paged<ErrorMigrationSummary>>('/admin/errors/migrations', { params })
      .then((r) => r.data),

  logs: (params?: ListErrorGroupsParams) =>
    apiClient
      .get<Paged<ErrorLogRow>>('/admin/errors/logs', { params })
      .then((r) => r.data),

  groupErrors: (
    groupId: string,
    params?: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      migration_id?: string;
      skip?: number;
      take?: number;
    },
  ) =>
    apiClient
      .get<Paged<ErrorLogEntry>>(`/admin/errors/groups/${groupId}/errors`, { params })
      .then((r) => r.data),

  setGroupStatus: (groupId: string, status: ErrorGroupStatus) =>
    apiClient
      .patch<ErrorGroup>(`/admin/errors/groups/${groupId}`, { status })
      .then((r) => r.data),

  detail: (id: string) =>
    apiClient.get<ErrorLogDetail>(`/admin/errors/${id}`).then((r) => r.data),
};
