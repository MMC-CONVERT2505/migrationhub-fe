import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MigrationJourney, SUMMARY_STEP, HANDOFF_STEP } from '@/components/migration/MigrationJourney';
import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';
import { PENDING_MIGRATION_LS_KEY, useAppStore } from '@/store/appStore';
import { formatCurrency } from '@/utils/format';
import { calculateMigrationPeriod, formatFinancialRange } from '@/utils/financialYear';
import { PlatformMark } from '@/components/common/PlatformMark';
import { pairDetailsPath } from '@/utils/platformMap';
import type { PendingMigration } from '@/types';

const COUNTDOWN = 5;
type Stage = 'summary' | 'creating' | 'done' | 'error';

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 20px', borderBottom: '1px solid #dce2ef', fontSize: 13,
  }}>
    <span style={{ color: '#4b5568' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
  </div>
);

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentId = searchParams.get('paymentId') ?? '';

  const resetMigration = useAppStore((s) => s.resetMigration);

  // Snapshot store at mount — resetMigration() wipes the store mid-flight so
  // we capture pair/plan once and keep them for the full page lifecycle.
  const [pair] = useState(() => useAppStore.getState().selectedPair);
  const [plan] = useState(() => {
    const s = useAppStore.getState();
    return s.selectedPair?.plans.find((p) => p.id === s.selectedPlanId) ?? null;
  });
  // Snapshot the inquiry id for the free flow (no Razorpay redirect to wipe it);
  // the paid flow carries it through the localStorage PendingMigration instead.
  const [inquiryId] = useState(() => useAppStore.getState().inquiryDetails?.id ?? null);
  // Financial-year-end is persisted in the store (sessionStorage) so it survives
  // the Razorpay redirect; snapshot it once for the page lifecycle.
  const [financialYearEnd] = useState(
    () => useAppStore.getState().inquiryDetails?.financialYearEnd ?? null,
  );

  // A pair not globally flagged free can still carry a $0 plan — this page
  // must read "free" for that selection too (no "Amount paid: $0.00 USD").
  const isFree = (pair?.isFree ?? false) || (plan != null && Number(plan.basePrice) === 0);

  // Migration period derived from the FY end + plan coverage — mirrors the
  // checkout order summary and the range the backend stored at creation.
  const dateRange = plan
    ? formatFinancialRange(
        calculateMigrationPeriod(financialYearEnd, plan.years, plan.isInception),
      )
    : null;

  const [stage, setStage] = useState<Stage>('summary');
  const [tick, setTick] = useState(COUNTDOWN);
  const [apiError, setApiError] = useState('');
  const calledRef = useRef(false);
  // Gate on an explicit Confirm click rather than mount — the customer must
  // get a chance to Edit before anything starts ticking down.
  const [confirmed, setConfirmed] = useState(false);

  const editUrl = pair
    ? `${pairDetailsPath(pair)}?edit=1${paymentId ? `&paymentId=${encodeURIComponent(paymentId)}` : ''}`
    : null;

  // ── Create migration (called by countdown or "Start now" button) ──────────
  const triggerCreate = useCallback(async () => {
    if (calledRef.current) return;
    calledRef.current = true;
    setStage('creating');

    let pending: PendingMigration | null = null;
    try {
      const raw = localStorage.getItem(PENDING_MIGRATION_LS_KEY);
      if (raw) pending = JSON.parse(raw) as PendingMigration;
    } catch { /* malformed */ }

    // Paid: prefer localStorage (survives Razorpay redirect).
    // Free: fall back to snapshotted pair/plan.
    const migPairId = pending?.migrationPairId ?? (pair?.id ? String(pair.id) : undefined);
    const planId = pending?.planId ?? plan?.id ?? undefined;
    const resolvedInquiryId = pending?.inquiryId ?? inquiryId ?? undefined;

    try {
      const result = await migrationsService.create({
        ...(paymentId ? { paymentId } : {}),
        ...(migPairId ? { migrationPairId: migPairId } : {}),
        ...(planId ? { planId } : {}),
        ...(resolvedInquiryId ? { inquiryId: resolvedInquiryId } : {}),
      });

      localStorage.removeItem(PENDING_MIGRATION_LS_KEY);
      resetMigration();

      // Redirect to the migration tool — serviceUrl comes from the nested
      // migrationPair in the response; fall back to the snapshotted pair URL.
      const migrationId = result.id;
      const serviceUrl = result.migrationPair?.serviceUrl
        ?? result.migrationPair?.fallbackServiceUrl
        ?? pair?.toolUrl
        ?? null;

      // Build redirect: strip trailing slash, then pass the migration ID and the
      // journey step the remote tool should resume from ("Connect Source") as
      // named query params. The remote React app reads them via
      // useSearchParams().get('migrationId') / get('journeyStep').
      const base = serviceUrl?.replace(/\/+$/, '') ?? null;

      if (base && migrationId) {
        const params = new URLSearchParams({
          migrationId: String(migrationId),
          journeyStep: String(HANDOFF_STEP),
        });
        window.location.href = `${base}?${params.toString()}`;
      } else {
        setStage('done');
      }
    } catch (err) {
      localStorage.removeItem(PENDING_MIGRATION_LS_KEY);
      setApiError(err instanceof ApiError ? err.message : 'Migration could not be queued. Please contact support.');
      setStage('error');
    }
  }, [paymentId, pair, plan, inquiryId, resetMigration]);

  // ── Countdown — only once the customer has clicked Confirm ─────────────────
  useEffect(() => {
    if (stage !== 'summary' || !confirmed) return;
    if (tick <= 0) { triggerCreate(); return; }
    const t = setTimeout(() => setTick((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [tick, stage, confirmed, triggerCreate]);

  // ── Auto-navigate after done ──────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'done') return;
    const t = setTimeout(() => navigate('/migrations'), 3000);
    return () => clearTimeout(t);
  }, [stage, navigate]);

  const retry = () => {
    calledRef.current = false;
    setApiError('');
    setTick(COUNTDOWN);
    setStage('summary');
  };

  const accentColor = isFree ? '#16a34a' : '#2563eb';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc' }}>
      <Navbar variant="default" />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 24px 0' }}>
        <MigrationJourney current={SUMMARY_STEP} />
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Summary + countdown / creating ─────────────────────────────── */}
        {(stage === 'summary' || stage === 'creating') && (
          <>
            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: isFree ? '#dcfce7' : '#dbeafe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24"
                  stroke={accentColor} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                {isFree ? 'Migration Ready' : 'Payment Confirmed'}
              </h1>
              <p style={{ fontSize: 14, color: '#4b5568' }}>
                {isFree
                  ? 'Review your migration details below'
                  : 'Your payment has been processed successfully'}
              </p>
            </div>

            {/* Details card */}
            <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>

              {/* Migration pair */}
              {pair && (
                <div style={{
                  padding: '16px 20px', borderBottom: '1px solid #dce2ef',
                  display: 'flex', alignItems: 'center', gap: 14, background: '#f0f4fa',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PlatformMark
                      logo={pair.srcLogo}
                      abbr={pair.srcAbbr}
                      color={pair.srcColor}
                      name={pair.src}
                      className="w-9 h-9 rounded-lg"
                      textClassName="text-[10px] font-extrabold"
                    />
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9ba3b8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <PlatformMark
                      logo={pair.dstLogo}
                      abbr={pair.dstAbbr}
                      color={pair.dstColor}
                      name={pair.dst}
                      className="w-9 h-9 rounded-lg"
                      textClassName="text-[10px] font-extrabold"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      {pair.src} → {pair.dst}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#4b5568', marginTop: 2 }}>Migration pair</div>
                  </div>
                </div>
              )}

              {/* Plan details */}
              {plan ? (
                <>
                  <SummaryRow label="Plan" value={plan.name} />
                  <SummaryRow label="Historical data" value={plan.history} />
                  {financialYearEnd && <SummaryRow label="Financial year end" value={financialYearEnd} />}
                  {dateRange && <SummaryRow label="Date range" value={dateRange} />}
                  <SummaryRow label="Support" value={plan.support} />
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '13px 20px', background: '#f0f4fa',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {isFree ? 'Total' : 'Amount paid'}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: accentColor }}>
                      {isFree ? 'Free' : `${formatCurrency(plan.basePrice)} USD`}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '16px 20px', fontSize: 13, color: '#9ba3b8' }}>
                  Plan details not available.
                </div>
              )}
            </div>

            {/* Edit / Confirm / countdown / spinner */}
            <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, padding: '18px 20px', textAlign: 'center' }}>
              {!confirmed ? (
                <>
                  <p style={{ fontSize: 13, color: '#4b5568', marginBottom: 14 }}>
                    Please review your details above. You can still edit your migration
                    details before confirming — the plan and payment are already locked in.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {editUrl && (
                      <button
                        onClick={() => navigate(editUrl)}
                        style={{
                          flex: 1, background: '#fff', color: '#4b5568',
                          border: '1px solid #dce2ef', borderRadius: 7, padding: '11px 0',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Edit details
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmed(true)}
                      style={{
                        flex: 1, background: accentColor, color: '#fff',
                        border: 'none', borderRadius: 7, padding: '11px 0',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      Confirm &amp; continue
                    </button>
                  </div>
                </>
              ) : stage === 'summary' ? (
                <>
                  <p style={{ fontSize: 13, color: '#4b5568', marginBottom: 12 }}>
                    Your migration will start in{' '}
                    <strong style={{ color: accentColor, fontFamily: 'monospace', fontSize: 15 }}>
                      {tick}
                    </strong>{' '}
                    seconds…
                  </p>
                  <div style={{ height: 5, background: '#e8edf7', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{
                      height: '100%', borderRadius: 99, background: accentColor,
                      width: `${((COUNTDOWN - tick) / COUNTDOWN) * 100}%`,
                      transition: 'width 1s linear',
                    }} />
                  </div>
                  <button
                    onClick={triggerCreate}
                    style={{
                      width: '100%', background: accentColor, color: '#fff',
                      border: 'none', borderRadius: 7, padding: '11px 0',
                      fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}
                  >
                    Start migration now
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div className="animate-spin" style={{
                    width: 20, height: 20,
                    border: '2.5px solid #dce2ef', borderTopColor: accentColor,
                    borderRadius: '50%',
                  }} />
                  <p style={{ fontSize: 13, color: '#4b5568' }}>Queuing your migration…</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Done ─────────────────────────────────────────────────────────── */}
        {stage === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Migration Queued!</h2>
            <p style={{ fontSize: 14, color: '#4b5568', marginBottom: 28 }}>
              Your migration has been queued successfully. Redirecting to your dashboard…
            </p>
            <button
              onClick={() => navigate('/migrations')}
              style={{
                background: '#2563eb', color: '#fff', border: 'none',
                borderRadius: 8, padding: '11px 28px', fontSize: 14,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              View migrations →
            </button>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Migration could not be started
            </h2>
            <p style={{ fontSize: 14, color: '#4b5568', marginBottom: 28 }}>{apiError}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={retry}
                style={{
                  background: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '11px 24px', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Try again
              </button>
              <button
                onClick={() => navigate('/migrations')}
                style={{
                  background: '#fff', color: '#4b5568', border: '1px solid #dce2ef',
                  borderRadius: 8, padding: '11px 24px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                View migrations
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentSuccessPage;
