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
  getById: (id: number) =>
    apiClient
      .get<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}`)
      .then((r) => r.data),

  /** Update a migration pair. Requires write permission. */
  update: (id: number, data: UpdateMigrationPairRequest) =>
    apiClient
      .patch<ApiResponse<MigrationPairEntity>>(`/migration-pairs/${id}`, data)
      .then((r) => r.data),

  /** Delete a migration pair. Returns 204. Requires delete permission. */
  delete: (id: number) =>
    apiClient
      .delete<void>(`/migration-pairs/${id}`)
      .then((r) => r.data),

  /** Rotate the webhook secret for a migration pair. Requires write permission. */
  rotateSecret: (id: number) =>
    apiClient
      .post<ApiResponse<RotateSecretResponse>>(`/migration-pairs/${id}/rotate-secret`)
      .then((r) => r.data),
};
