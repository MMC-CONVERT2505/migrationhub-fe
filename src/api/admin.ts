import { apiClient } from './client';
import type {
  ActivityItem,
  AdminProfile,
  AnalyticsOutcomes,
  AnalyticsPair,
  AnalyticsSummary,
  ApiResponse,
  AuditLogItem,
  AuthenticateAdminRequest,
  ChangeAdminPasswordRequest,
  GetActivitiesQuery,
  PaginatedResponse,
  UpdateAdminProfileRequest,
  UpdateProfileImageRequest,
} from '@/types/api';

export const adminService = {
  /** Get the admin's own profile. */
  getProfile: () =>
    apiClient
      .get<ApiResponse<AdminProfile>>('/admin')
      .then((r) => r.data),

  /** Update the admin's own profile. */
  updateProfile: (data: UpdateAdminProfileRequest) =>
    apiClient
      .patch<ApiResponse<AdminProfile>>('/admin', data)
      .then((r) => r.data),

  /** Replace the admin's profile image URL. */
  updateProfileImage: (data: UpdateProfileImageRequest) =>
    apiClient
      .post<ApiResponse<AdminProfile>>('/admin/profile-image', data)
      .then((r) => r.data),

  /** Change the admin's password. */
  changePassword: (data: ChangeAdminPasswordRequest) =>
    apiClient
      .post<ApiResponse>('/admin/change-password', data)
      .then((r) => r.data),

  /** Re-confirm identity before sensitive actions. */
  authenticate: (data: AuthenticateAdminRequest) =>
    apiClient
      .post<ApiResponse>('/admin/authenticate', data)
      .then((r) => r.data),
};

export const analyticsService = {
  /** 4 KPI stat cards. Cache: 30 s. */
  getSummary: () =>
    apiClient
      .get<AnalyticsSummary>('/admin/analytics/summary')
      .then((r) => r.data),

  /** Pair-by-pair breakdown table. Cache: 30 s. */
  getPairs: () =>
    apiClient
      .get<{ pairs: AnalyticsPair[] }>('/admin/analytics/pairs')
      .then((r) => r.data),

  /** Live activity feed. Cache: 10 s. */
  getActivity: (limit = 20) =>
    apiClient
      .get<{ items: ActivityItem[] }>('/admin/analytics/activity', { params: { limit } })
      .then((r) => r.data),

  /** Donut + bar chart data. Cache: 30 s. */
  getOutcomes: () =>
    apiClient
      .get<AnalyticsOutcomes>('/admin/analytics/outcomes')
      .then((r) => r.data),
};

export const activitiesService = {
  /** Paginated audit log. Supports level, from/to, type, userId, adminId filters. */
  list: (params?: GetActivitiesQuery) =>
    apiClient
      .get<PaginatedResponse<AuditLogItem>>('/activities', { params })
      .then((r) => r.data),
};
