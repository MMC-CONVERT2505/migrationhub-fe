import { apiClient } from './client';
import type {
  CreateMigrationRequest,
  MigrationRecord,
  UserMigration,
} from '@/types/api';

export const migrationsService = {
  /** Kick off a migration after payment is verified. */
  create: (data: CreateMigrationRequest) =>
    apiClient
      .post<MigrationRecord>('/migrations', data)
      .then((r) => r.data),

  /** Fetch all migrations for the authenticated user. */
  list: () =>
    apiClient
      .get<{ data: UserMigration[]; total: number; skip: number; take: number }>('/migrations')
      .then((r) => r.data.data ?? r.data as unknown as UserMigration[]),

  /** Fetch a single migration by ID. */
  getById: (id: string) =>
    apiClient
      .get<UserMigration>(`/migrations/${id}`)
      .then((r) => r.data),
};
