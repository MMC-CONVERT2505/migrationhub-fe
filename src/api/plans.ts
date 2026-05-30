import { apiClient } from './client';
import type {
  ApiPlan,
  ApiResponse,
  CreatePlanRequest,
  UpdatePlanRequest,
} from '@/types/api';

export const plansService = {
  /** Create a new plan. Requires write permission. */
  create: (data: CreatePlanRequest) =>
    apiClient
      .post<ApiResponse<ApiPlan>>('/plans', data)
      .then((r) => r.data),

  /** Fetch all available plans. */
  list: () =>
    apiClient
      .get<ApiResponse<ApiPlan[]>>('/plans')
      .then((r) => r.data),

  /** Update a plan by ID. Requires write permission. */
  update: (planId: number, data: UpdatePlanRequest) =>
    apiClient
      .patch<ApiResponse<ApiPlan>>(`/plans/${planId}`, data)
      .then((r) => r.data),

  /** Delete a plan by ID. Returns 204. Requires delete permission. */
  delete: (planId: number) =>
    apiClient
      .delete<void>(`/plans/${planId}`)
      .then((r) => r.data),
};
