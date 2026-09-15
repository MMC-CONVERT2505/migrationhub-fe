import { apiClient } from './client';
import type { TransactionPlan } from '@/constants/transactionPlans';

export interface CreateInquiryRequest {
  name: string;
  email: string;
  phone: string;
  country: string;
  entityName: string;
  financialYearEnd: string;
  transactionPlan?: TransactionPlan;
  /** Customer's confirmation of the optional add-ons. */
  addOnsConfirmed?: boolean;
  /** Whether the file uses tracked inventory — asked by the MYOB-bound tools only. */
  trackingInventory?: boolean;
  migrationPairId?: string;
}

// Both yes/no answers come back nullable: null is a question that was never put to
// the customer, which reads differently from a "No" they actually gave.
export interface InquiryMigrationUser
  extends Omit<CreateInquiryRequest, 'addOnsConfirmed' | 'trackingInventory'> {
  id: number;
  userId: number | null;
  userEmail?: string | null;
  addOnsConfirmed: boolean | null;
  trackingInventory: boolean | null;
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
