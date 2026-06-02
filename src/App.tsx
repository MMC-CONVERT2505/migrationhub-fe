import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@/components/common/Spinner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/auth/AdminGuard';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const HomePage            = React.lazy(() => import('@/pages/HomePage'));
const PaymentPage         = React.lazy(() => import('@/pages/PaymentPage'));
const PaymentSuccessPage  = React.lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentFailedPage   = React.lazy(() => import('@/pages/PaymentFailedPage'));
const MigrationPage        = React.lazy(() => import('@/pages/MigrationPage'));
const MigrationHistoryPage = React.lazy(() => import('@/pages/MigrationHistoryPage'));
const SignInPage          = React.lazy(() => import('@/pages/SignInPage'));
const SignUpPage          = React.lazy(() => import('@/pages/SignUpPage'));

// Admin sub-pages
const AdminDashboard      = React.lazy(() => import('@/pages/AdminPage'));
const MigrationPairsPage  = React.lazy(() => import('@/pages/admin/MigrationPairsPage'));
const PlansPage           = React.lazy(() => import('@/pages/admin/PlansPage'));
const AuditPage           = React.lazy(() => import('@/pages/admin/AuditPage'));

// ─── Full-screen loading fallback ─────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-text-tertiary font-medium">Loading…</p>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/payment"         element={<PaymentPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/failed"  element={<PaymentFailedPage />} />
      <Route path="/migration"         element={<MigrationPage />} />
      <Route path="/migrations"       element={<MigrationHistoryPage />} />
      <Route path="/sign-in"   element={<SignInPage />} />
      <Route path="/sign-up"   element={<SignUpPage />} />

      {/* Admin — guard checks auth + admin role before rendering layout */}
      <Route path="/admin" element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route index                  element={<AdminDashboard />} />
          <Route path="migration-pairs" element={<MigrationPairsPage />} />
          <Route path="plans"           element={<PlansPage />} />
          <Route path="audit"           element={<AuditPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
