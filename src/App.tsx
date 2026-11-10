import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Spinner } from '@/components/common/Spinner';
import { RouteSEO } from '@/components/seo/SEO';
import { HashScroll } from '@/components/common/HashScroll';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAppStore } from '@/store/appStore';
import { pairDetailsPath } from '@/utils/platformMap';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const HomePage            = React.lazy(() => import('@/pages/HomePage'));
const AboutPage           = React.lazy(() => import('@/pages/AboutPage'));
const ContactPage         = React.lazy(() => import('@/pages/ContactPage'));
const PaymentPage         = React.lazy(() => import('@/pages/PaymentPage'));
const PaymentSuccessPage  = React.lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentFailedPage   = React.lazy(() => import('@/pages/PaymentFailedPage'));
const PrivacyPage         = React.lazy(() => import('@/pages/PrivacyPage'));
const SecurityPage        = React.lazy(() => import('@/pages/SecurityPage'));
const TermsPage           = React.lazy(() => import('@/pages/TermsPage'));
const ForgotPasswordPage  = React.lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage   = React.lazy(() => import('@/pages/ResetPasswordPage'));
const ChangePasswordPage  = React.lazy(() => import('@/pages/ChangePasswordPage'));
const MigrationPage        = React.lazy(() => import('@/pages/MigrationPage'));
const MigrationPlanPage     = React.lazy(() => import('@/pages/MigrationPlanPage'));
const MigrationDetailsPage  = React.lazy(() => import('@/pages/MigrationDetailsPage'));
const MigrationDetailsEntryPage = React.lazy(() => import('@/pages/MigrationDetailsEntryPage'));
const MigrationHistoryPage = React.lazy(() => import('@/pages/MigrationHistoryPage'));
const MigrationTrackPage   = React.lazy(() => import('@/pages/MigrationTrackPage'));
const SignInPage          = React.lazy(() => import('@/pages/SignInPage'));
const HowItWorksPage        = React.lazy(() => import('@/pages/HowItWorksPage'));
const SupportedPlatformsPage = React.lazy(() => import('@/pages/SupportedPlatformsPage'));
const NotFoundPage        = React.lazy(() => import('@/pages/NotFoundPage'));
const SignUpPage          = React.lazy(() => import('@/pages/SignUpPage'));

const AdminLoginPage      = React.lazy(() => import('@/pages/AdminLoginPage'));

// Admin sub-pages
const AdminDashboard      = React.lazy(() => import('@/pages/AdminPage'));
const MigrationPairsPage  = React.lazy(() => import('@/pages/admin/MigrationPairsPage'));
const ToolLogosPage       = React.lazy(() => import('@/pages/admin/ToolLogosPage'));
const PlansPage           = React.lazy(() => import('@/pages/admin/PlansPage'));
const AuditPage           = React.lazy(() => import('@/pages/admin/AuditPage'));
const ContactsPage        = React.lazy(() => import('@/pages/admin/ContactsPage'));
const MigrationsPage      = React.lazy(() => import('@/pages/admin/MigrationsPage'));
const MigrationDetailPage = React.lazy(() => import('@/pages/admin/MigrationDetailPage'));
const ErrorLogsPage             = React.lazy(() => import('@/pages/admin/ErrorLogsPage'));
const MigrationReviewsPage      = React.lazy(() => import('@/pages/admin/MigrationReviewsPage'));
const MigrationReviewDetailPage = React.lazy(() => import('@/pages/admin/MigrationReviewDetailPage'));
const ReportsPage         = React.lazy(() => import('@/pages/admin/ReportsPage'));
const InquiriesPage       = React.lazy(() => import('@/pages/admin/InquiriesPage'));
const UsersPage           = React.lazy(() => import('@/pages/admin/UsersPage'));
const CreateUserPage   = React.lazy(() => import('@/pages/admin/CreateUserPage'));
const RolesPage           = React.lazy(() => import('@/pages/admin/RolesPage'));
const PermissionsPage     = React.lazy(() => import('@/pages/admin/PermissionsPage'));
const SettingsPage        = React.lazy(() => import('@/pages/admin/SettingsPage'));
const MigrationCleanerPage = React.lazy(() => import('@/pages/admin/MigrationCleanerPage'));
const FaqsPage            = React.lazy(() => import('@/pages/admin/FaqsPage'));
const FaqFormPage         = React.lazy(() => import('@/pages/admin/FaqFormPage'));

/** Legacy flow URLs (the old step-2 and FAQ pages, plus the Xero → MYOB / Reckon One
 *  dedicated routes that shared them): send them to the start of the flow so old links and
 *  bookmarks keep working, and so an unresolvable visit still leaves via the homepage. */
const LegacyFlowRedirect: React.FC = () => {
  const selectedPair = useAppStore((s) => s.selectedPair);
  return <Navigate to={selectedPair ? pairDetailsPath(selectedPair) : '/'} replace />;
};

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
/** One crashing page shows a retry message instead of a blank screen; navigating elsewhere clears it. */
const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>;
};

/**
 * A page the browser restores from its back/forward cache keeps its old in-memory state and never re-runs the app's
 * start-up. The flow lock is written to the tab's saved session by pages visited after it, so re-read that
 * session whenever a cached page is shown again — otherwise Back could show a stale home page inside a locked flow.
 */
const SessionResync: React.FC = () => {
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) void useAppStore.persist.rehydrate();
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);
  return null;
};

const App: React.FC = () => (
  <RouteBoundary>
  <SessionResync />
  <HashScroll />
  <RouteSEO />
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/about"     element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/supported-platforms" element={<SupportedPlatformsPage />} />
      <Route path="/contact"   element={<ContactPage />} />
      <Route path="/privacy"   element={<PrivacyPage />} />
      <Route path="/security"  element={<SecurityPage />} />
      <Route path="/termsofuse" element={<TermsPage />} />
      <Route path="/payment"         element={<PaymentPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      <Route path="/payment/failed"  element={<PaymentFailedPage />} />
      {/* Flow: Plan → Customer Details → Payment → Success, all scoped to the pair in the URL */}
      <Route path="/migration/:pairSlug/plan" element={<PairSlugGate><MigrationPlanPage /></PairSlugGate>} />
      <Route path="/migration/:pairSlug/customer-details" element={<MigrationDetailsPage />} />
      <Route path="/migration/:pairSlug/details" element={<LegacyFlowRedirect />} />
      <Route path="/migration/details" element={<LegacyFlowRedirect />} />
      {/* Deep-link entry from an external destination platform — resolves the pair, locks the flow;
          lands on the Plan page, where a plan passed as ?plan= is pre-selected */}
      <Route path="/migration/details/:pairSlug/:isFree" element={<MigrationDetailsEntryPage />} />
      <Route path="/migration/faq"     element={<LegacyFlowRedirect />} />
      <Route path="/migration"         element={<MigrationPage />} />
      <Route path="/migrations"       element={<MigrationHistoryPage />} />
      <Route path="/migrations/:id"   element={<MigrationTrackPage />} />
      <Route path="/sign-in"   element={<SignInPage />} />
      <Route path="/sign-up"   element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />


      {/* Admin login — public, no guard */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Admin — guard checks auth + admin role before rendering layout */}
      <Route path="/admin" element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route index                    element={<AdminDashboard />} />
          <Route path="users"            element={<UsersPage />} />
          <Route path="users/create"     element={<CreateUserPage />} />
          <Route path="roles"            element={<RolesPage />} />
          <Route path="permissions"      element={<PermissionsPage />} />
          <Route path="migration-pairs"  element={<MigrationPairsPage />} />
          <Route path="tool-logos"       element={<ToolLogosPage />} />
          <Route path="faqs"             element={<FaqsPage />} />
          <Route path="faqs/new"         element={<FaqFormPage />} />
          <Route path="faqs/:id"         element={<FaqFormPage />} />




          <Route path="plans"            element={<PlansPage />} />
          <Route path="settings"         element={<SettingsPage />} />
          <Route path="settings/migration-cleaner" element={<MigrationCleanerPage />} />
          <Route path="audit"            element={<AuditPage />} />
          <Route path="contacts"         element={<ContactsPage />} />
          <Route path="inquiries"        element={<InquiriesPage />} />
          <Route path="migrations"       element={<MigrationsPage />} />
          <Route path="migrations/:id"   element={<MigrationDetailPage />} />
          <Route path="migration-reviews"       element={<MigrationReviewsPage />} />
          <Route path="migration-reviews/:id"   element={<MigrationReviewDetailPage />} />
          <Route path="error-logs"       element={<ErrorLogsPage />} />
          <Route path="reports"          element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Unknown paths get a real 404 page, not the homepage */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
  </RouteBoundary>
);

export default App;
