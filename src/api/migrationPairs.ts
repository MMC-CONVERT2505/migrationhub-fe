import { apiClient } from './client';
import type {
  ApiResponse,
  CreateMigrationPairRequest,
  ListMigrationPairsQuery,
  MigrationPairEntity,
  PaginatedResponse,
  RotateSecretResponse,
  UpdateMigrationPairRequest,
} from '@/types/api';

export const migrationPairsService = {
  /** Public listing — no auth required. Returns active, non-maintenance pairs with isFree and plans. */
  available: () =>
    apiClient
      .get<MigrationPairEntity[]>('/migration-pairs/available')
      .then((r) => r.data),

  /** Create a new migration pair. Requires write permission. */
  create: (data: CreateMigrationPairRequest) =>
    apiClient
      .post<ApiResponse<MigrationPairEntity>>('/migration-pairs', data)
      .then((r) => r.data),

  /** List migration pairs with optional filters. Requires read permission. */
  list: (params?: ListMigrationPairsQuery) =>
    apiClient
      .get<PaginatedResponse<MigrationPairEntity>>('/migration-pairs', { params })
      .then((r) => r.data),

  /** Get a single migration pair by ID. Requires read permission. */
  getById: (id: number | string) =>
    apiClient
      .get<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}`)
      .then((r) => r.data),

  /** Update a migration pair. Requires write permission. */
  update: (id: number | string, data: UpdateMigrationPairRequest) =>
    apiClient
      .patch<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}`, data)
      .then((r) => r.data),

  /** Delete a migration pair. Returns 204. Requires delete permission. */
  delete: (id: number | string) =>
    apiClient
      .delete<void>(`/migration-pairs/${id}`)
      .then((r) => r.data),

  /** Rotate the webhook secret for a migration pair. Requires write permission. */
  rotateSecret: (id: number | string) =>
    apiClient
      .post<ApiResponse<RotateSecretResponse>>(`/migration-pairs/${id}/rotate-secret`)
      .then((r) => r.data),

  /** Attach or replace the plan on a migration pair. Requires write permission. */
  attachPlan: (id: number | string, planId: string) =>
    apiClient
      .put<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}/plan`, { planId })
      .then((r) => r.data),

  /** Remove a specific plan from a migration pair. Requires write permission. */
  detachPlan: (id: number | string, planId: string) =>
    apiClient
      .delete<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}/plan/${planId}`)
      .then((r) => r.data),
};
