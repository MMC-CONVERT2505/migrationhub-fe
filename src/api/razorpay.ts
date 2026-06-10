import { apiClient } from './client';
import type {
  ApiResponse,
  CreateDepositOrderRequest,
  RazorpayOrder,
  RefundPaymentRequest,
  VerifyPaymentRequest,
} from '@/types/api';

export const razorpayService = {
  /** Create a Razorpay order for wallet top-up / plan purchase.
   *  Use the returned `id` as `razorpayOrderId` in the verify call. */
  createDepositOrder: (data: CreateDepositOrderRequest) =>
    apiClient
      .post<ApiResponse<RazorpayOrder>>('/razorpay/deposit', data)
      .then((r) => r.data),

  /** Verify payment signature after the Razorpay checkout modal closes. */
  verifyPayment: (data: VerifyPaymentRequest) =>
    apiClient
      .post<ApiResponse>('/razorpay/verify', data)
      .then((r) => r.data),

  /** Request a full or partial refund for a captured payment. */
  refundPayment: (data: RefundPaymentRequest) =>
    apiClient
      .post<ApiResponse>('/razorpay/refund', data)
      .then((r) => r.data),
};
