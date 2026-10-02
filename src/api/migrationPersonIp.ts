import { apiClient } from './client';
import type {
  CreateMigrationPersonIpMappingRequest,
  ListMigrationPersonIpMappingsQuery,
  MigrationPersonIpMappingEntity,
  UpdateMigrationPersonIpMappingRequest,
} from '@/types/api';

export const migrationPersonIpService = {
  /** List person/machine-IP mappings. Requires read permission. */
  list: (params?: ListMigrationPersonIpMappingsQuery) =>
    apiClient.get('/migration-person-ip', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<MigrationPersonIpMappingEntity>(`/migration-person-ip/${id}`)
      .then((r) => r.data),

  create: (data: CreateMigrationPersonIpMappingRequest) =>
    apiClient
      .post<MigrationPersonIpMappingEntity>('/migration-person-ip', data)
      .then((r) => r.data),

  update: (id: string, data: UpdateMigrationPersonIpMappingRequest) =>
    apiClient
      .patch<MigrationPersonIpMappingEntity>(
        `/migration-person-ip/${id}`,
        data,
      )
      .then((r) => r.data),

  /** Returns 204. Requires delete permission. */
  delete: (id: string) =>
    apiClient.delete<void>(`/migration-person-ip/${id}`).then((r) => r.data),
};
