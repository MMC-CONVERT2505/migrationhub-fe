import { apiClient } from './client';
import type {
  ApiResponse,
  ChangePasswordRequest,
  CreateSubUserRequest,
  GetRemarksQuery,
  ListUsersQuery,
  PaginatedResponse,
  Remark,
  ResetUserPasswordRequest,
  SetUserStatusRequest,
  UpdateProfileImageRequest,
  UpdateProfileRequest,
  UserProfile,
} from '@/types/api';

export const usersService = {
  /** Get the authenticated user's own profile. */
  getMe: () =>
    apiClient
      .get<UserProfile | ApiResponse<UserProfile>>('/users/me')
      // The API returns the bare profile; callers read `.data`. Accept both shapes so the
      // profile (name, roles) actually reaches the store.
      .then((r): ApiResponse<UserProfile> => {
        const body = r.data as UserProfile | ApiResponse<UserProfile>;
        return { data: ('data' in body && body.data ? body.data : body) as UserProfile } as ApiResponse<UserProfile>;
      }),

  /** Update the authenticated user's own profile. */
  updateMe: (data: UpdateProfileRequest) =>
    apiClient
      .patch<ApiResponse<UserProfile>>('/users/me', data)
      .then((r) => r.data),

  /** Replace the authenticated user's profile image URL. */
  updateProfileImage: (data: UpdateProfileImageRequest) =>
    apiClient
      .post<ApiResponse<UserProfile>>('/users/me/profile-image', data)
      .then((r) => r.data),

  /** Change the authenticated user's password. */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient
      .post<ApiResponse>('/users/me/change-password', data)
      .then((r) => r.data),

  // ── Admin-only ───────────────────────────────────────────────────────────

  /** List all users with optional pagination/search. Requires admin permission. */
  listUsers: (params?: ListUsersQuery) =>
    apiClient
      .get<PaginatedResponse<UserProfile>>('/users', { params })
      .then((r) => r.data),

  /** Create a sub-user under the admin account. Requires admin permission. */
  createSubUser: (data: CreateSubUserRequest) =>
    apiClient
      .post<ApiResponse<UserProfile>>('/users/create-sub-user', data)
      .then((r) => r.data),

  /** Get a user by their ID. Requires admin permission. */
  getUserById: (userId: number) =>
    apiClient
      .get<ApiResponse<UserProfile>>(`/users/${userId}`)
      .then((r) => r.data),

  /** Update any user by their ID. Requires admin permission. */
  updateUserById: (userId: number, data: Partial<UpdateProfileRequest> & { password?: string }) =>
    apiClient
      .patch<ApiResponse<UserProfile>>(`/users/${userId}`, data)
      .then((r) => r.data),

  /** Permanently delete a user. Refused (409) while the user has payments, migrations or other records. Requires users.delete. */
  deleteUser: (userId: number) =>
    apiClient
      .delete<{ status: true; message: string; deleted: { id: number; email: string | null; name: string } }>(`/users/${userId}`)
      .then((r) => r.data),

  /** Force-reset a user's password. Requires admin permission. */
  resetUserPassword: (userId: number, data: ResetUserPasswordRequest) =>
    apiClient
      .post<ApiResponse>(`/users/${userId}/reset-password`, data)
      .then((r) => r.data),

  /** Create an admin remark on a user. Requires admin permission. */
  createRemark: (userId: number, remark: string) =>
    apiClient
      .post<ApiResponse<Remark>>(`/users/${userId}/remarks`, { remark })
      .then((r) => r.data),

  /** Fetch paginated remarks for a user. Requires admin permission. */
  getRemarks: (userId: number, params?: GetRemarksQuery) =>
    apiClient
      .get<PaginatedResponse<Remark>>(`/users/${userId}/remarks`, { params })
      .then((r) => r.data),

  /** Delete a specific remark. Requires admin permission. */
  deleteRemark: (userId: number, remarkId: number) =>
    apiClient
      .delete<ApiResponse>(`/users/${userId}/remarks/${remarkId}`)
      .then((r) => r.data),

  /** Set a user's active/banned/suspended status. Requires admin permission. */
  setUserStatus: (userId: number, data: SetUserStatusRequest) =>
    apiClient
      .post<ApiResponse>(`/users/${userId}/status`, data)
      .then((r) => r.data),
};
