import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { currentScope, getSession, useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:9001';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  // 304 Not Modified is a successful cache hit — treat it like 200
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: string[];

  constructor(statusCode: number, message: string, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function clearAuthAndRedirect(): void {
  const path = window.location.pathname;
  useAuthStore.getState().logout(currentScope());
  // Remember where the person was, so signing back in returns them there instead of home.
  const here = encodeURIComponent(`${path}${window.location.search}`);
  if (path.startsWith('/admin') && path !== '/admin/login') {
    window.location.replace('/admin/login');
  } else if (!path.startsWith('/admin') && path !== '/sign-in' && path !== '/sign-up') {
    window.location.replace(`/sign-in?next=${here}&expired=1`);
  }
}

// Only the session belonging to the current area is sent — an admin session
// must never authenticate a request made from the public site.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getSession(currentScope()).accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ApiErrorBody = {
  statusCode: number;
  message: string | string[];
  errors?: string[];
};

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Only redirect on 401 when the request was sent with a token (session expired).
      // Unauthenticated requests that simply lack a token should fail silently.
      if (status === 401 && getSession(currentScope()).accessToken) {
        clearAuthAndRedirect();
      }

      // NestJS sometimes returns message as an array of validation strings
      let message = Array.isArray(data?.message)
        ? data.message[0]
        : (data?.message ?? 'Request failed');

      // Rate limiting and bare server errors carry framework text ("ThrottlerException",
      // "Internal server error") that means nothing to the person looking at it.
      if (status === 429) message = 'Too many requests. Please wait a moment and try again.';
      else if (status >= 500 && (!data?.message || /^internal server error$/i.test(String(message)))) {
        message = 'Something went wrong on our side. Please try again shortly.';
      }

      throw new ApiError(
        data?.statusCode ?? status,
        message,
        data?.errors ?? (Array.isArray(data?.message) ? data.message : undefined),
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new ApiError(0, 'Request timed out. Please try again.');
    }

    throw new ApiError(0, 'Network error. Check your connection and try again.');
  },
);
