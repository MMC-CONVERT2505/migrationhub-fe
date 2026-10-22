import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { FlowLayout } from '@/components/migration/FlowLayout';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { HANDOFF_STEP } from '@/components/migration/MigrationJourney';
import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';
import { PENDING_MIGRATION_LS_KEY, useAppStore } from '@/store/appStore';
import { usePaymentSkipped } from '@/hooks/usePaymentSkipped';
import { formatCurrency } from '@/utils/format';
import { readySummaryRows } from '@/utils/readySummary';
import { calculateMigrationPeriod, formatFinancialRange } from '@/utils/financialYear';
import { findSelectedPlan, isFreeSelection, planCurrency, resolveFlowRedirect } from '@/constants/migrationFlow';
import type { PendingMigration } from '@/types';
import type { UserMigration } from '@/types/api';

const COUNTDOWN = 5;
/** While a payment is still settling, re-check this often and for this many attempts. */
const VERIFY_INTERVAL_MS = 4000;
const VERIFY_MAX_ATTEMPTS = 8;

type Stage = 'verifying' | 'summary' | 'creating' | 'done' | 'error' | 'loading-existing' | 'already-created';

function readPendingMigration(): PendingMigration | null {
  try {
    const raw = localStorage.getItem(PENDING_MIGRATION_LS_KEY);
    return raw ? (JSON.parse(raw) as PendingMigration) : null;
  } catch {
    return null; // malformed — treat the same as absent
  }
}

// Shared by the just-created redirect and the already-created recovery view
// (reached via migrationId in the URL) so both build the same handoff URL.
function buildToolRedirectUrl(migrationId: string, serviceUrl?: string | null): string | null {
  const base = serviceUrl?.replace(/\/+$/, '') ?? null;
  if (!base) return null;
  const params = new URLSearchParams({
    migrationId: String(migrationId),
    journeyStep: String(HANDOFF_STEP),
  });
  return `${base}?${params.toString()}`;
}

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-[13px] sm:px-5">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="text-right font-semibold text-text-primary">{value}</dd>
  </div>
);

const IconCircle: React.FC<{ tone: 'green' | 'blue' | 'red'; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    aria-hidden="true"
    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
      tone === 'green' ? 'bg-green-100 text-green-600' : tone === 'red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
    }`}
  >
    {children}
  </div>
);
const CheckIcon = (
  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const CrossIcon = (
  <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId') ?? '';
  // The callback only sends status=success once the payment is settled. Anything else
  // with a paymentId (e.g. "paid" before settlement) is still being confirmed.
  const paymentStatus = searchParams.get('status');
  // Stamped into the URL (replacing history) right after a successful create
  // — see triggerCreate. Lets a browser-back from the handoff redirect (or a
  // reload) show that migration's own summary instead of trying to create a
  // second one from session state that's already been reset.
  const [existingMigrationId] = useState(() => searchParams.get('migrationId'));

  const resetMigration = useAppStore((s) => s.resetMigration);

  // Snapshot store at mount — resetMigration() wipes the store mid-flight so
  // we capture pair/plan once and keep them for the full page lifecycle.
  const [snap] = useState(() => {
    const s = useAppStore.getState();
    return {
      pair: s.selectedPair,
      planId: s.selectedPlanId,
      plan: findSelectedPlan(s.selectedPair, s.selectedPlanId),
      inquiry: s.inquiryDetails,
    };
  });
  const { pair, plan } = snap;
  // Financial-year-end is persisted in the store (sessionStorage) so it survives
  // the Razorpay redirect; snapshot it once for the page lifecycle.
  const financialYearEnd = snap.inquiry?.financialYearEnd ?? null;
  // Snapshot localStorage pending-migration once too — it survives the Razorpay redirect.
  const [pending] = useState(readPendingMigration);

  // Paid: prefer localStorage (survives the Razorpay redirect).
  // Free / $0-plan: fall back to the snapshotted pair/plan.
  const migPairId = pending?.migrationPairId ?? (pair?.id ? String(pair.id) : undefined);
  const planId = pending?.planId ?? plan?.id ?? undefined;
  const resolvedInquiryId = pending?.inquiryId ?? snap.inquiry?.id ?? undefined;

  const isFree = isFreeSelection(pair, plan);
  // Operation Team on a paid plan, arriving without a payment: nothing was paid.
  const operationTeamSkip = usePaymentSkipped(pair?.isFree ?? false, plan) && !paymentId;
  const noPayment = isFree || operationTeamSkip;
  const currency = planCurrency(plan);

  const dateRange = plan
    ? formatFinancialRange(calculateMigrationPeriod(financialYearEnd, plan.years, plan.isInception))
    : null;

  const needsVerification = !existingMigrationId && Boolean(paymentId) && paymentStatus !== 'success';
  const [stage, setStage] = useState<Stage>(
    existingMigrationId ? 'loading-existing' : needsVerification ? 'verifying' : 'summary',
  );
  const [tick, setTick] = useState(COUNTDOWN);
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const [apiError, setApiError] = useState('');
  const [existingMigration, setExistingMigration] = useState<UserMigration | null>(null);
  const calledRef = useRef(false);

  // ── Load an already-created migration instead of creating a new one ───────
  const loadExisting = useCallback((id: string) => {
    setApiError('');
    setStage('loading-existing');
    migrationsService
      .getById(id)
      .then((m) => {
        setExistingMigration(m);
        setStage('already-created');
      })
      .catch((err) => {
        setApiError(err instanceof ApiError ? err.message : 'That migration could not be found.');
        setStage('error');
      });
  }, []);

  useEffect(() => {
    if (existingMigrationId) loadExisting(existingMigrationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create migration (countdown, "Start migration", or a payment-verification retry) ──
  const triggerCreate = useCallback(async (verifying = false) => {
    if (calledRef.current) return;
    calledRef.current = true;
    if (!verifying) setStage('creating');

    try {
      const result = await migrationsService.create({
        ...(paymentId ? { paymentId } : {}),
        ...(migPairId ? { migrationPairId: migPairId } : {}),
        ...(planId ? { planId } : {}),
        ...(resolvedInquiryId ? { inquiryId: resolvedInquiryId } : {}),
      });

      localStorage.removeItem(PENDING_MIGRATION_LS_KEY);
      resetMigration();

      // Stamp the created id into this page's own URL (replacing history, not
      // pushing) before leaving — resetMigration() just wiped the session
      // state this page was built from, so a later browser-back (from the
      // handoff redirect below) needs the URL itself to recover this
      // migration's details instead of landing on a blank slate.
      const migrationId = result.id;
      navigate(`/payment/success?migrationId=${migrationId}`, { replace: true });

      // Redirect to the migration tool — serviceUrl comes from the nested
      // migrationPair in the response; fall back to the snapshotted pair URL.
      const serviceUrl = result.migrationPair?.serviceUrl
        ?? result.migrationPair?.fallbackServiceUrl
        ?? pair?.toolUrl
        ?? null;
      const redirectUrl = buildToolRedirectUrl(migrationId, serviceUrl);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setStage('done');
      }
    } catch (err) {
      calledRef.current = false;
      // The server refuses a payment it hasn't settled yet ("… is not confirmed"). While
      // verifying, that just means "not yet" — keep checking instead of failing.
      if (verifying && err instanceof ApiError && /not confirmed/i.test(err.message)) {
        setVerifyAttempts((n) => n + 1);
        return;
      }
      localStorage.removeItem(PENDING_MIGRATION_LS_KEY);
      setApiError(err instanceof ApiError ? err.message : 'Migration could not be queued. Please contact support.');
      setStage('error');
    }
  }, [paymentId, migPairId, planId, resolvedInquiryId, pair, resetMigration, navigate]);

  // ── Verifying: re-check a still-settling payment until it confirms or we give up ──
  useEffect(() => {
    if (stage !== 'verifying' || verifyAttempts >= VERIFY_MAX_ATTEMPTS) return;
    const t = setTimeout(() => { void triggerCreate(true); }, verifyAttempts === 0 ? 0 : VERIFY_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [stage, verifyAttempts, triggerCreate]);

  // ── Visible countdown to the automatic start ──────────────────────────────
  useEffect(() => {
    if (stage !== 'summary') return;
    if (tick <= 0) { void triggerCreate(); return; }
    const t = setTimeout(() => setTick((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [tick, stage, triggerCreate]);

  // ── Auto-navigate after done ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'done') return;
    const t = setTimeout(() => navigate('/migrations'), 3000);
    return () => clearTimeout(t);
  }, [stage, navigate]);

  const retry = () => {
    if (existingMigrationId) {
      loadExisting(existingMigrationId);
      return;
    }
    calledRef.current = false;
    setApiError('');
    setTick(COUNTDOWN);
    setStage('summary');
  };

  // Nothing confirmed and nothing to confirm: back to the earliest incomplete step.
  if (!existingMigrationId && !paymentId) {
    const redirect = resolveFlowRedirect('success', {
      pair, planId: snap.planId, inquiry: snap.inquiry, paymentSkipped: operationTeamSkip, paymentId,
    });
    if (redirect) return <Navigate to={redirect} replace />;
  }

  const accentText = noPayment ? 'text-green-600' : 'text-blue-600';

  return (
    <FlowLayout page="success" widthClass="max-w-xl">
      {/* ── Loading an already-created migration ─────────────────────────── */}
      {stage === 'loading-existing' && (
        <div role="status" className="flex items-center justify-center gap-3 py-16">
          <Spinner size="md" />
          <p className="text-sm text-text-secondary">Loading your migration…</p>
        </div>
      )}

      {/* ── Already created — reached via back/reload, not a new checkout ── */}
      {stage === 'already-created' && existingMigration && (
        <div className="text-center">
          <IconCircle tone="blue">{CheckIcon}</IconCircle>
          <h1 className="mb-1.5 text-[22px] font-bold text-text-primary">This migration is already started</h1>
          <p className="mb-7 text-sm text-text-secondary">
            {existingMigration.migrationPair.displayName} · {existingMigration.plan.name} plan
          </p>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => {
              const url = buildToolRedirectUrl(existingMigration.id, existingMigration.migrationPair.serviceUrl);
              if (url) { window.location.href = url; } else { navigate('/migrations'); }
            }}
          >
            Continue migration →
          </Button>
        </div>
      )}

      {/* ── Payment still settling ───────────────────────────────────────── */}
      {stage === 'verifying' && (
        <div role="status" aria-live="polite" className="text-center">
          <IconCircle tone="blue"><Spinner size="md" /></IconCircle>
          <h1 className="mb-1.5 text-[22px] font-bold text-text-primary">Verifying payment…</h1>
          {verifyAttempts < VERIFY_MAX_ATTEMPTS ? (
            <p className="text-sm text-text-secondary">
              We&rsquo;re confirming your payment with the bank. This usually takes a few seconds — please keep this page open.
            </p>
          ) : (
            <>
              <p className="mb-5 text-sm text-text-secondary">
                Your payment is taking longer than usual to confirm. You haven&rsquo;t been charged twice — check again in a moment, or contact us with reference {paymentId}.
              </p>
              <div className="flex flex-col justify-center gap-2 sm:flex-row">
                <Button type="button" variant="primary" onClick={() => setVerifyAttempts(0)}>Check again</Button>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-primary hover:bg-bg-light"
                >
                  Contact us
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Confirmed: summary + countdown / creating ─────────────────────── */}
      {(stage === 'summary' || stage === 'creating') && (
        <>
          <div className="mb-7 text-center">
            <IconCircle tone={noPayment ? 'green' : 'blue'}>{CheckIcon}</IconCircle>
            <h1 className="mb-1.5 text-[22px] font-bold text-text-primary">
              {noPayment ? 'Migration Ready' : 'Payment Confirmed'}
            </h1>
            <p className="text-sm text-text-secondary">
              {noPayment ? 'Review your migration details below' : 'Your payment has been processed successfully'}
            </p>
          </div>

          {pair && <SelectedPairBanner pair={pair} className="mb-4" />}

          <div className="mb-4 overflow-hidden rounded-xl border border-border bg-white">
            <dl>
              {readySummaryRows({
                inquiry: snap.inquiry,
                history: plan?.history,
                financialYearEnd,
                dateRange,
              }).map((r) => (
                <SummaryRow key={r.label} label={r.label} value={r.value} />
              ))}
              {plan && (
                <div className="flex items-center justify-between gap-4 bg-bg-light px-4 py-3.5 sm:px-5">
                  <dt className="text-[13px] font-bold text-text-primary">
                    {operationTeamSkip ? 'Payment' : isFree ? 'Total' : 'Amount paid'}
                  </dt>
                  <dd className={`font-mono text-base font-bold ${accentText}`}>
                    {operationTeamSkip
                      ? 'Skipped (Operation Team)'
                      : isFree
                        ? 'Free'
                        : `${formatCurrency(plan.basePrice)} ${currency}`}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 text-center sm:p-5">
            {stage === 'summary' ? (
              <>
                <p className="mb-3 text-[13px] text-text-secondary" aria-live="polite">
                  Your migration will start in{' '}
                  <strong className={`font-mono text-[15px] ${accentText}`}>{tick}</strong> seconds…
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-lighter" aria-hidden="true">
                  <div
                    className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${noPayment ? 'bg-green-600' : 'bg-blue-600'}`}
                    style={{ width: `${((COUNTDOWN - tick) / COUNTDOWN) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div role="status" className="flex items-center justify-center gap-3">
                <Spinner size="md" />
                <p className="text-[13px] text-text-secondary">Queuing your migration…</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Done ─────────────────────────────────────────────────────────── */}
      {stage === 'done' && (
        <div className="text-center">
          <IconCircle tone="green">{CheckIcon}</IconCircle>
          <h1 className="mb-2 text-[22px] font-bold text-text-primary">Migration Queued!</h1>
          <p className="mb-7 text-sm text-text-secondary">
            Your migration has been queued successfully. Redirecting to your dashboard…
          </p>
          <Button type="button" variant="primary" size="lg" onClick={() => navigate('/migrations')}>View migrations →</Button>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {stage === 'error' && (
        <div role="alert" className="text-center">
          <IconCircle tone="red">{CrossIcon}</IconCircle>
          <h1 className="mb-2 text-xl font-bold text-text-primary">
            {existingMigrationId ? 'This migration could not be loaded' : 'Migration could not be started'}
          </h1>
          <p className="mb-7 text-sm text-text-secondary">{apiError}</p>
          <div className="flex justify-center gap-2.5">
            <Button type="button" variant="primary" onClick={retry}>Try again</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/migrations')}>View migrations</Button>
          </div>
        </div>
      )}
    </FlowLayout>
  );
};

export default PaymentSuccessPage;
