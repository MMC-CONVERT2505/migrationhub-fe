import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spinner } from '@/components/common/Spinner';

// ─── Lazy-loaded pages for code splitting ────────────────────────────────────
const HomePage      = React.lazy(() => import('@/pages/HomePage'));
const PaymentPage   = React.lazy(() => import('@/pages/PaymentPage'));
const MigrationPage = React.lazy(() => import('@/pages/MigrationPage'));
const AdminPage     = React.lazy(() => import('@/pages/AdminPage'));
const SignInPage    = React.lazy(() => import('@/pages/SignInPage'));
const SignUpPage    = React.lazy(() => import('@/pages/SignUpPage'));

// ─── Full-screen loading fallback ────────────────────────────────────────────
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-text-tertiary font-medium">Loading…</p>
    </div>
  </div>
);

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/payment"   element={<PaymentPage />} />
      <Route path="/migration" element={<MigrationPage />} />
      <Route path="/admin"     element={<AdminPage />} />
      <Route path="/sign-in"   element={<SignInPage />} />
      <Route path="/sign-up"   element={<SignUpPage />} />
      {/* Catch-all redirect */}
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default App;
