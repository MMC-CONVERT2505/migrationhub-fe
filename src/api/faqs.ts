import { apiClient } from './client';
import type {
  CreateFaqRequest,
  FaqEntity,
  ListFaqsQuery,
  PublicFaqResponse,
  UpdateFaqRequest,
} from '@/types/api';

export const faqsService = {
  /** List FAQ sets. Requires read permission. */
  list: (params?: ListFaqsQuery) =>
    apiClient.get('/faqs', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<FaqEntity>(`/faqs/${id}`).then((r) => r.data),

  create: (data: CreateFaqRequest) =>
    apiClient.post<FaqEntity>('/faqs', data).then((r) => r.data),

  update: (id: string, data: UpdateFaqRequest) =>
    apiClient.patch<FaqEntity>(`/faqs/${id}`, data).then((r) => r.data),

  /** Returns 204. Requires delete permission. */
  delete: (id: string) =>
    apiClient.delete<void>(`/faqs/${id}`).then((r) => r.data),

  /** Public — no auth. `faq` is null when the pair has none configured. */
  byPair: (migrationPairId: string) =>
    apiClient
      .get<PublicFaqResponse>(`/faqs/public/pair/${migrationPairId}`)
      .then((r) => r.data),
};
