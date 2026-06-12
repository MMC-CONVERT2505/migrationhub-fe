import { apiClient } from './client';
import type {
  BannerEntity,
  CreateBannerRequest,
  ListBannersQuery,
  UpdateBannerRequest,
} from '@/types/api';

export const bannersService = {
  /** List banners, optionally filtered by type/platform/status. */
  list: (params?: ListBannersQuery) =>
    apiClient
      .get('/banner/get-banners', { params })
      .then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<BannerEntity>(`/banner/${id}`).then((r) => r.data),

  /** Create a banner. `image` is the file name returned by uploadService. */
  create: (data: CreateBannerRequest) =>
    apiClient
      .post<BannerEntity>('/banner/create', data)
      .then((r) => r.data),

  update: (id: number, data: UpdateBannerRequest) =>
    apiClient
      .patch<BannerEntity>(`/banner/update/${id}`, data)
      .then((r) => r.data),

  delete: (id: number) =>
    apiClient
      .delete<{ message: string }>(`/banner/delete/${id}`)
      .then((r) => r.data),
};
