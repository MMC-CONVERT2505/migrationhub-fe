import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { migrationsService } from '@/api/migrations';
import { ApiError } from '@/api/client';
import { PENDING_MIGRATION_KEY } from '@/components/payment/PaymentForm';

type PageState = 'loading' | 'migration-started' | 'migration-failed' | 'no-migration-data';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const paymentId      = searchParams.get('payment_id') ?? '';

  const [pageState, setPageState]     = useState<PageState>('loading');
  const [migrationError, setMigrationError] = useState('');

  useEffect(() => {
    startMigration();
  }, []);

  const startMigration = async () => {
    // Read the pending migration context written by PaymentForm before redirect.
    const raw = sessionStorage.getItem(PENDING_MIGRATION_KEY);

    if (!raw) {
      // Could happen if user refreshes the success page after it already ran,
      // or if they navigated here directly. Treat as success without re-triggering.
      setPageState('no-migration-data');
      return;
    }

    let migrationPairId: string;
    let planId: string;

    try {
      const parsed = JSON.parse(raw) as { migrationPairId: string; planId: string };
      migrationPairId = parsed.migrationPairId;
      planId          = parsed.planId;
    } catch {
      sessionStorage.removeItem(PENDING_MIGRATION_KEY);
      setPageState('no-migration-data');
      return;
    }

    // Always clear — only one attempt per payment session.
    sessionStorage.removeItem(PENDING_MIGRATION_KEY);

    try {
      await migrationsService.create({ migrationPairId, planId });
      setPageState('migration-started');
    } catch (err) {
      // Payment is already confirmed — the migration call failing must not block the user.
      // Show a soft error with the payment reference so support can reconcile.
      setMigrationError(
        err instanceof ApiError
          ? err.message
          : 'Migration could not be queued automatically.',
      );
      setPageState('migration-failed');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="default" />

      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        {pageState === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary">Starting your migration…</p>
          </div>
        )}

        {(pageState === 'migration-started' || pageState === 'no-migration-data') && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {pageState === 'migration-started' ? 'Migration started!' : 'Payment confirmed!'}
            </h1>
            <p className="text-text-secondary mb-1">
              {pageState === 'migration-started'
                ? 'Your migration has been queued and will begin processing shortly.'
                : 'Your payment was received. Your migration will begin shortly.'}
            </p>
            {paymentId && (
              <p className="text-xs text-text-tertiary font-mono mb-8">Ref: {paymentId}</p>
            )}

            <div className="bg-white border border-border rounded-xl p-5 text-left mb-8 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">What happens next?</h2>
              {[
                'Your migration is now queued and will begin shortly.',
                'You will receive a confirmation email with your migration details.',
                'Track progress in real-time on the migration dashboard.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-text-secondary">{step}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/migration')}>
                View migration progress
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
                Back to home
              </Button>
            </div>
          </motion.div>
        )}

        {pageState === 'migration-failed' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Payment succeeded but migration queuing failed */}
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2">Payment confirmed!</h1>
            <p className="text-text-secondary mb-6">Your payment was received successfully.</p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left mb-8">
              <p className="text-sm font-semibold text-amber-800 mb-1">Migration setup needs attention</p>
              <p className="text-sm text-amber-700 mb-2">{migrationError}</p>
              <p className="text-sm text-amber-700">
                Your payment is safe. Please contact{' '}
                <a href="mailto:support@mmcconvert.com" className="font-medium underline">
                  support@mmcconvert.com
                </a>{' '}
                with reference{' '}
                <span className="font-mono font-medium">{paymentId}</span>{' '}
                and we'll start your migration immediately.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" size="lg" onClick={() => navigate('/migration')}>
                Go to dashboard
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/')}>
                Back to home
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
