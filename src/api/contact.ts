import { apiClient } from './client';

export interface ContactRequest {
  email: string;
  companyName: string;
  country: string;
  /** Optional — full international number, e.g. "+61412345678". Omitted when not provided. */
  phone?: string;
}

export interface ContactItem {
  id: number;
  email: string;
  companyName: string;
  country: string;
  phone: string | null;
  isWelcomeMailSent: boolean;
  isReachedOut: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListContactsParams {
  skip?: number;
  take?: number;
  isReachedOut?: boolean;
  search?: string;
}

export interface ContactListResponse {
  data: ContactItem[];
  total: number;
  skip: number;
  take: number;
}

export interface UpdateContactRequest {
  isWelcomeMailSent?: boolean;
  isReachedOut?: boolean;
}

export const contactService = {
  /** Public — submit a contact / sales enquiry. */
  submit: (data: ContactRequest) =>
    apiClient
      .post<{ success: boolean; id: number; message: string }>('/contact', data)
      .then((r) => r.data),

  /** Admin — paginated list of submissions. */
  list: (params?: ListContactsParams) =>
    apiClient
      .get<ContactListResponse>('/contact', { params })
      .then((r) => r.data),

  /** Admin — update outreach / welcome-mail flags. */
  update: (id: number, data: UpdateContactRequest) =>
    apiClient.patch<ContactItem>(`/contact/${id}`, data).then((r) => r.data),
};
