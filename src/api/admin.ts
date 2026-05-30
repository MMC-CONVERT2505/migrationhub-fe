import { apiClient } from './client';
import type {
  AdminProfile,
  ApiResponse,
  AuthenticateAdminRequest,
  ChangeAdminPasswordRequest,
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
