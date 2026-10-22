import { apiClient } from './client';
import type {
  ApiResponse,
  AuthTokenPayload,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SendCodeRequest,
  VerifyCodeRequest,
  VerifyOtpRequest,
} from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9001';

export const authService = {
  /** Step 1 of registration: deliver OTP to email or mobile. */
  sendCode: (data: SendCodeRequest) =>
    apiClient
      .post<ApiResponse>('/auth/send-code', data)
      .then((r) => r.data),

  /** Step 2 of registration: confirm OTP. */
  verifyCode: (data: VerifyCodeRequest) =>
    apiClient
      .post<ApiResponse>('/auth/verify-code', data)
      .then((r) => r.data),

  /** Step 3 of registration: create account. Returns JWT directly. */
  register: (data: RegisterRequest) =>
    apiClient
      .post<AuthTokenPayload>('/auth/register', data)
      .then((r) => r.data),

  /** Sign in with email/phone + password. Returns JWT directly. */
  login: (data: LoginRequest) =>
    apiClient
      .post<AuthTokenPayload>('/auth/login', data)
      .then((r) => r.data),

  /** Google OAuth — redirect the browser to this URL directly. */
  googleOAuthUrl: `${BASE_URL}/auth/google`,

  /** Invalidate the current session on the server. */
  logout: () =>
    apiClient
      .post<ApiResponse>('/auth/logout')
      .then((r) => r.data),

  /** Verify OTP received by mobile (alternate path). */
  verifyOtp: (data: VerifyOtpRequest) =>
    apiClient
      .post<ApiResponse>('/auth/verify-otp', data)
      .then((r) => r.data),

  /** Initiate password-reset flow: sends OTP to mobile. */
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient
      .post<ApiResponse>('/auth/forgot-password', data)
      .then((r) => r.data),

  /** Complete password-reset using the OTP. */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient
      .post<ApiResponse>('/auth/reset-password', data)
      .then((r) => r.data),

  /** Email a single-use reset link. Always succeeds the same way, whether or not the account exists. */
  requestPasswordReset: (email: string) =>
    apiClient
      .post<{ status: string; message: string }>('/auth/password-reset/request', { email })
      .then((r) => r.data),

  /** Set a new password from the token in the emailed link. */
  confirmPasswordReset: (token: string, newPassword: string) =>
    apiClient
      .post<{ status: string }>('/auth/password-reset/confirm', { token, newPassword })
      .then((r) => r.data),
};
