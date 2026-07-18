import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/store/authStore';

interface JwtPayload {
  sub?: number;
  type?: string;
  roles?: string[];
  permissions?: string[];
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isAdminToken(token: string, userRoles?: string[]): boolean {
  if (userRoles?.includes('admin')) return true;
  const payload = decodeJwt(token);
  if (!payload) return false;
  return (
    payload.type === 'admin' ||
    (Array.isArray(payload.roles) && payload.roles.includes('admin'))
  );
}

export const AdminGuard: React.FC = () => {
  const { accessToken, user } = useSession('admin');

  if (!accessToken) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdminToken(accessToken, user?.roles)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-sm text-text-secondary mb-6">
            You don't have permission to view the admin panel. Contact your administrator if you believe this is a mistake.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
