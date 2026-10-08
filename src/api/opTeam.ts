import { apiClient } from './client';
import type { OpTeamMember } from '@/store/opTeamStore';

export interface OpTeamLoginResponse {
  accessToken: string;
  member: OpTeamMember;
}

export const opTeamService = {
  login: (email: string, password: string) =>
    apiClient
      .post<OpTeamLoginResponse>('/auth/op-team/login', { email, password })
      .then((r) => r.data),

  /** 401 when the stored token is expired or the member was deactivated. */
  me: () => apiClient.get<OpTeamMember>('/auth/op-team/me').then((r) => r.data),

  logout: () => apiClient.post('/auth/op-team/logout').then((r) => r.data),
};
