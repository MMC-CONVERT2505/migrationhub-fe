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

  groupErrors: (
    groupId: string,
    params?: { category?: ErrorCategory; severity?: ErrorSeverity; skip?: number; take?: number },
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
