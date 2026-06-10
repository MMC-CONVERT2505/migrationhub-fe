import { apiClient } from './client';
import type { CreateRoleRequest, Role, UpdateRoleRequest } from '@/types/api';

export const rolesService = {
  list: () =>
    apiClient.get<Role[]>('/roles').then((r) => r.data),

  create: (data: CreateRoleRequest) =>
    apiClient.post<Role>('/roles', data).then((r) => r.data),

  update: (id: number, data: UpdateRoleRequest) =>
    apiClient.patch<Role>(`/roles/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete<void>(`/roles/${id}`).then((r) => r.data),
};
