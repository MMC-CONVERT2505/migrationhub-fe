import { apiClient } from './client';
import type { TransactionPlan } from '@/constants/transactionPlans';

export interface CreateInquiryRequest {
  name: string;
  email: string;
  /** Optional for Operation Team members, who have no phone field. */
  phone?: string;
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

/** "Final Summary" edit, before Confirm. Same shape as create, minus the pair
 *  (immutable once the inquiry exists). */
export type UpdateInquiryRequest = Omit<CreateInquiryRequest, 'migrationPairId'>;

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
  /** Present only in the POST /inquiry-migrations response — see PATCH's
   *  x-inquiry-edit-token header. */
  editToken?: string;
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

  /** "Final Summary" edit, before Confirm — authorized by the row's own edit
   *  token (from the create response), not a session; this checkout is often
   *  anonymous. Never send the token any other way (no query param, no log). */
  update: (id: number, editToken: string, data: UpdateInquiryRequest) =>
    apiClient
      .patch<InquiryMigrationUser>(`/inquiry-migrations/${id}`, data, {
        headers: { 'x-inquiry-edit-token': editToken },
      })
      .then((r) => r.data),

  /** Admin — list all submissions. */
  list: (params?: ListInquiriesParams) =>
    apiClient.get<InquiryListResponse>('/inquiry-migrations', { params }).then((r) => r.data),
};
