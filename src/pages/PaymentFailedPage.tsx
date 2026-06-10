import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/common/Button';

const REASON_LABELS: Record<string, string> = {
  cancelled:       'Payment was cancelled.',
  expired:         'The payment link has expired.',
  failed:          'Payment was declined by your bank.',
  signature_error: 'Payment could not be verified. Please contact support.',
};

const PaymentFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const reason         = searchParams.get('reason') ?? 'failed';
  const paymentId      = searchParams.get('paymentId');

  const label = REASON_LABELS[reason] ?? 'Something went wrong with your payment.';

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="default" />

      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Failure icon */}
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-2">Payment unsuccessful</h1>
          <p className="text-text-secondary mb-1">{label}</p>
          {paymentId && (
            <p className="text-xs text-text-tertiary font-mono mb-8">
              Ref: {paymentId}
            </p>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left mb-8">
            <p className="text-sm font-semibold text-amber-800 mb-1">Your card was not charged</p>
            <p className="text-sm text-amber-700">
              No payment has been taken. You can safely try again or use a different payment method.
              If you believe this is an error, contact{' '}
              <a href="mailto:support@mmcconvert.com" className="underline font-medium">
                support@mmcconvert.com
              </a>{' '}
              with the reference above.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/payment')}
            >
              Try again
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
            >
              Back to home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;
