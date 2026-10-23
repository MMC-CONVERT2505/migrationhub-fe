import React, { useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { FlowLayout } from '@/components/migration/FlowLayout';
import { SelectedPairBanner } from '@/components/migration/SelectedPairBanner';
import { OrderSummary } from '@/components/payment/OrderSummary';
import { Button } from '@/components/common/Button';
import { useAppStore } from '@/store/appStore';
import { usePaymentSkipped } from '@/hooks/usePaymentSkipped';
import { useCheckoutSelection } from '@/hooks/useCheckoutSelection';
import { paymentsService } from '@/api/payments';
import { ApiError } from '@/api/client';
import { formatCurrencyCompact } from '@/utils/format';
import { planCurrency, resolveFlowRedirect, SUCCESS_PATH } from '@/constants/migrationFlow';

/** Why the customer is back here after the payment provider sent them away (see /payment/failed). */
const FAILURE_LABELS: Record<string, string> = {
  cancelled:       'Payment was cancelled.',
  expired:         'The payment link has expired.',
  failed:          'Payment was declined by your bank.',
  signature_error: 'Payment could not be verified. Please contact support.',
  invalid_signature: 'Payment could not be verified. Please contact support.',
};

/** Flow step 3: review the order and pay. Summary and a single CTA — nothing to fill in. */
const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPair = useAppStore((s) => s.selectedPair);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const inquiryDetails = useAppStore((s) => s.inquiryDetails);
  const setPendingMigration = useAppStore((s) => s.setPendingMigration);

  // `total` is the plan price plus any extra years the customer chose; the server recomputes it.
  const { plan, total, extension, extendedYears } = useCheckoutSelection();
  const paymentSkipped = usePaymentSkipped(selectedPair?.isFree ?? false, plan);

  const [processing, setProcessing] = useState(false);
  // Synchronous guard: state updates are async, so two fast clicks could both pass a
  // `processing` check before the first render disables the button.
  const inFlight = useRef(false);

  const failureReason = searchParams.get('status') === 'failed' ? (searchParams.get('reason') ?? 'failed') : null;
  const failurePaymentId = searchParams.get('paymentId');
  const [error, setError] = useState(failureReason ? (FAILURE_LABELS[failureReason] ?? 'Something went wrong with your payment.') : '');

  // Missing pair, plan or details (refresh, pasted URL): back to the earliest incomplete step.
  const redirect = resolveFlowRedirect('payment', { pair: selectedPair, planId: selectedPlanId, inquiry: inquiryDetails, paymentSkipped, extensionCost: extension });
  if (!selectedPair || !plan || redirect) return <Navigate to={redirect ?? '/'} replace />;

  const currency = planCurrency(plan);
  const amount = Math.round(total * 100);

  const handlePay = async () => {
    if (inFlight.current) return;
    if (!selectedPair.id || !plan.id) {
      setError('Migration pair or plan is missing. Please go back and try again.');
      return;
    }
    inFlight.current = true;
    setError('');
    setProcessing(true);

    const migrationPairId = String(selectedPair.id);
    const planId = plan.id;
    const pending = {
      migrationPairId,
      planId,
      ...(inquiryDetails?.id ? { inquiryId: inquiryDetails.id } : {}),
      ...(extendedYears ? { years: extendedYears } : {}),
    };

    // Operation Team: paid plan, nothing due — same Start migration step a free one takes.
    if (paymentSkipped) {
      setPendingMigration(pending);
      navigate(SUCCESS_PATH);
      return;
    }

    try {
      const res = await paymentsService.initiate({
        amount,
        migrationPairId,
        planId,
        ...(extendedYears ? { years: extendedYears } : {}),
        currency: 'USD',
        description: `${plan.name} Migration Plan${extendedYears ? ` (${extendedYears} financial years)` : ''}`,
        name: inquiryDetails?.name,
        email: inquiryDetails?.email,
        company: inquiryDetails?.entityName,
      });
      if (!res.paymentUrl) throw new Error('No payment URL returned by server.');

      setPendingMigration(pending);
      // Leaves the app; the button stays disabled with its loader until the page unloads.
      window.location.href = res.paymentUrl;
    } catch (err) {
      inFlight.current = false;
      setProcessing(false);
      setError(err instanceof ApiError ? err.message : 'Could not initiate payment. Please try again.');
    }
  };

  const ctaLabel = paymentSkipped
    ? 'Start migration – payment skipped'
    : `Pay ${formatCurrencyCompact(total)} ${currency} – Complete Payment`;

  return (
    <FlowLayout page="payment" widthClass="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-text-primary">Review &amp; pay</h1>
      <p className="mt-1 mb-5 text-sm text-text-secondary">Check your order, then complete payment to begin your migration.</p>

      <SelectedPairBanner pair={selectedPair} className="mb-5" />

      <OrderSummary />

      {error && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-red-700">
            <p>{error}</p>
            {failurePaymentId && <p className="mt-0.5 font-mono text-xs text-red-500">Ref: {failurePaymentId}</p>}
            {failureReason && <p className="mt-0.5 text-xs text-red-600">No payment has been taken. You can safely try again.</p>}
          </div>
        </div>
      )}

      <div className="mt-5">
        <Button type="button" variant="primary" size="lg" fullWidth loading={processing} onClick={handlePay} aria-busy={processing}>
          {error && !processing && !paymentSkipped ? `Retry – ${ctaLabel}` : ctaLabel}
        </Button>
        {!paymentSkipped && (
          <p className="mt-3 text-center text-[11.5px] text-text-secondary">256-bit SSL · Powered by Razorpay · No card details stored here</p>
        )}
      </div>
    </FlowLayout>
  );
};

export default PaymentPage;
