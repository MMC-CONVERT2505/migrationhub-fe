import { apiClient } from './client';
import type {
  ApiResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  PaymentStatusResponse,
} from '@/types/api';


export const paymentsService = {
  /**
   * Ask the backend to create a Razorpay Payment Link.
   * The response contains `paymentUrl` — redirect the browser there immediately.
   * Zero Razorpay logic lives in the frontend.
   */
  // Backend returns the object directly — not wrapped in ApiResponse<T>.
  initiate: (data: InitiatePaymentRequest) =>
    apiClient
      .post<InitiatePaymentResponse>('/payments/initiate', data)
      .then((r) => r.data),

  /**
   * Poll payment status by internal payment ID.
   * Used by success / failure pages to display final state.
   */
  getStatus: (paymentId: string) =>
    apiClient
      .get<ApiResponse<PaymentStatusResponse>>(`/payments/status/${paymentId}`)
      .then((r) => r.data),
};
