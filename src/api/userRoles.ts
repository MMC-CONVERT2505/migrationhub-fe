import { apiClient } from './client';
import type { AssignUserRolesRequest } from '@/types/api';

export const userRolesService = {
  /** Full-replace all roles for a user. Always send the complete desired set. */
  assign: (data: AssignUserRolesRequest) =>
    apiClient
      .post<{ count: number }>('/user-roles/assign', data)
      .then((r) => r.data),
};
