import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { MigrationJourney } from '@/components/migration/MigrationJourney';
import { OrderSummary } from '@/components/payment/OrderSummary';
import { PaymentForm } from '@/components/payment/PaymentForm';
import { FreeMigrationForm } from '@/components/payment/FreeMigrationForm';
import { PlanCard } from '@/components/payment/PlanCard';
import { Spinner } from '@/components/common/Spinner';
import { PlatformMark } from '@/components/common/PlatformMark';
import { useAppStore } from '@/store/appStore';

import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';

const PaymentPage: React.FC = () => {
  const navigate          = useNavigate();
  const selectedPair      = useAppStore((s) => s.selectedPair);
  const selectedPlanId    = useAppStore((s) => s.selectedPlanId);
  const setSelectedPlanId = useAppStore((s) => s.setSelectedPlanId);

  const isFree = selectedPair?.isFree ?? false;

  // Display order: Free → Basic → Standard → Enterprise (unknown names sort last).
  const PLAN_ORDER = ['free', 'basic', 'standard', 'enterprise'];
  const plans = useMemo(() => {
    const rank = (name: string) => {
      const i = PLAN_ORDER.indexOf(name.trim().toLowerCase());
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...(selectedPair?.plans ?? [])].sort((a, b) => rank(a.name) - rank(b.name));
  }, [selectedPair]); // eslint-disable-line react-hooks/exhaustive-deps

  const [autoCreating, setAutoCreating] = useState(false);
  const [autoError, setAutoError]       = useState('');

  // Auto-select a plan when none valid is selected for the current pair.
  // Free pairs default to the Free plan; otherwise the first (lowest-tier) plan.
  useEffect(() => {
    if (plans.length === 0) return;
    const valid = plans.some((p) => p.id === selectedPlanId);
    if (valid) return;
    const freePlan = plans.find((p) => p.name.trim().toLowerCase() === 'free');
    const target = isFree && freePlan ? freePlan : plans[0];
    setSelectedPlanId(target.id!);
  }, [plans, isFree]); // eslint-disable-line react-hooks/exhaustive-deps

  // No plans attached → create a free migration immediately, skip UI.
  useEffect(() => {
    if (!selectedPair || plans.length > 0) return;

    if (!selectedPair.id) {
      setAutoError('Migration pair is missing an ID. Please go back and try again.');
      return;
    }

    setAutoCreating(true);
    const inquiryId = useAppStore.getState().inquiryDetails?.id;
    migrationsService
      .create({
        migrationPairId: String(selectedPair.id),
        ...(inquiryId ? { inquiryId } : {}),
      })
      .then(() => navigate('/migrations'))
      .catch((err) => {
        setAutoError(err instanceof ApiError ? err.message : 'Could not start migration. Please try again.');
        setAutoCreating(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── No-plans: full-screen loading / error ────────────────────────────────────
  if (plans.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fc' }}>
        <Navbar variant="payment" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          {autoCreating && (
            <>
              <Spinner size="lg" />
              <p style={{ fontSize: 14, color: '#4b5568' }}>Starting your migration…</p>
            </>
          )}
          {autoError && (
            <div style={{ maxWidth: 360, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Migration could not be started</p>
              <p style={{ fontSize: 14, color: '#4b5568' }}>{autoError}</p>
              <button
                style={{ fontSize: 14, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/')}
              >
                ← Back to home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fc' }}>
      <Navbar variant="payment" />

      {/* ── Pay header ──────────────────────────────────────────────────────── */}
      {selectedPair && (
        <div style={{ background: '#f0f4fa', borderBottom: '1px solid #dce2ef' }}>
          <div className="max-w-[960px] mx-auto px-4 sm:px-14 py-7">
            <p style={{ fontSize: 11.5, color: '#9ba3b8', marginBottom: 10, fontFamily: 'monospace' }}>
              MMC Convert
              <span style={{ color: '#4b5568' }}> / Migration Pairs / </span>
              {selectedPair.src} → {selectedPair.dst}
              <span style={{ color: '#4b5568' }}> / Checkout</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PlatformMark
                  logo={selectedPair.srcLogo}
                  abbr={selectedPair.srcAbbr}
                  color={selectedPair.srcColor}
                  name={selectedPair.src}
                  className="w-[38px] h-[38px] rounded-lg"
                  textClassName="text-[10px] font-extrabold"
                />
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9ba3b8" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <PlatformMark
                  logo={selectedPair.dstLogo}
                  abbr={selectedPair.dstAbbr}
                  color={selectedPair.dstColor}
                  name={selectedPair.dst}
                  className="w-[38px] h-[38px] rounded-lg"
                  textClassName="text-[10px] font-extrabold"
                />
              </div>
              <div>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#111827', letterSpacing: -0.3 }}>
                  {selectedPair.src} → {selectedPair.dst} Migration
                </div>
                <div style={{ fontSize: 12.5, color: '#4b5568', marginTop: 3 }}>
                  {isFree
                    ? 'This migration is free — select a plan to choose your data scope'
                    : 'Select a plan and complete payment to begin your migration'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay body ────────────────────────────────────────────────────────── */}
      <div className="max-w-[960px] mx-auto px-4 sm:px-14" style={{ paddingTop: 36, paddingBottom: 64 }}>
        <MigrationJourney current={4} className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]" style={{ gap: 24, alignItems: 'start' }}>

          {/* Left: plan list + order summary stacked */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
              {isFree ? 'Select Plan (Free)' : 'Select Migration Plan'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {plans.map((plan, i) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={i}
                  selected={selectedPlanId === plan.id}
                  onSelect={setSelectedPlanId}
                  isFree={isFree}
                />
              ))}
            </div>

            {/* Order summary below plans */}
            <OrderSummary />
          </div>

          {/* Right: form or placeholder */}
          <div className="lg:sticky lg:top-6">
            {!selectedPlanId ? (
              <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px', borderBottom: '1px solid #dce2ef', background: '#f0f4fa' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {isFree ? 'Ready to Start' : 'Payment Details'}
                  </h3>
                  <p style={{ fontSize: 12, color: '#4b5568', marginTop: 2 }}>
                    Select a plan on the left to continue
                  </p>
                </div>
                <div style={{ padding: '28px 22px', textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#f0f4fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9ba3b8" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#4b5568' }}>Select a plan to continue</p>
                  <p style={{ fontSize: 12, color: '#9ba3b8', marginTop: 5, lineHeight: 1.5 }}>
                    Choose one of the plans on the left to{' '}
                    {isFree ? 'start your free migration.' : 'proceed to payment.'}
                  </p>
                </div>
              </div>
            ) : isFree ? (
              <FreeMigrationForm />
            ) : (
              <PaymentForm />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
