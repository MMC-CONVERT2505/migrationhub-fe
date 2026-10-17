import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * The payment provider's failure callback still lands on /payment/failed (that URL is part
 * of the backend contract), but the customer is better served back on the Payment page with
 * the order summary still in view, an inline error and a Retry button.
 */
const PaymentFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  // status=paid here means the provider took the payment but our DB hasn't settled it yet
  // (the webhook will) — not a failure, so hand it to the success page's "Verifying" state.
  if (searchParams.get('status') === 'paid' && paymentId) {
    return <Navigate to={`/payment/success?paymentId=${encodeURIComponent(paymentId)}&status=paid`} replace />;
  }
  const params = new URLSearchParams({ status: 'failed', reason: searchParams.get('reason') ?? 'failed' });
  if (paymentId) params.set('paymentId', paymentId);
  return <Navigate to={`/payment?${params.toString()}`} replace />;
};

export default PaymentFailedPage;
