import { apiClient } from './client';

export interface CreateInquiryRequest {
  name: string;
  email: string;
  phone: string;
  country: string;
  entityName: string;
  financialYearEnd: string;
  yearsToMigrate: number;
  migrationStartDate: string; // ISO yyyy-mm-dd
  migrationEndDate: string;   // ISO yyyy-mm-dd
  migrationPairId?: string;
}

export interface InquiryMigrationUser extends CreateInquiryRequest {
  id: number;
  userId: number | null;
  userEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryListResponse {
  data: InquiryMigrationUser[];
  total: number;
  skip: number;
  take: number;
}

export interface ListInquiriesParams {
  skip?: number;
  take?: number;
  search?: string;
}

export const inquiryMigrationsService = {
  /** Authenticated user submits the Migration Information form. */
  create: (data: CreateInquiryRequest) =>
    apiClient.post<InquiryMigrationUser>('/inquiry-migrations', data).then((r) => r.data),

  /** Admin — list all submissions. */
  list: (params?: ListInquiriesParams) =>
    apiClient.get<InquiryListResponse>('/inquiry-migrations', { params }).then((r) => r.data),
};
