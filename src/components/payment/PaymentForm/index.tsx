import React, { useState } from 'react';
import { cn, formatCurrency } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { GST_RATE } from '@/constants/plans';
import { paymentsService } from '@/api/payments';
import { ApiError } from '@/api/client';
import { useAppStore } from '@/store/appStore';
import type { Plan } from '@/types';

export const PENDING_MIGRATION_KEY = 'mmc-pending-migration';

interface PaymentFormProps {
  plan: Plan;
}

const INPUT_CLASS = cn(
  'w-full px-3 py-2.5 text-sm text-text-primary bg-white border border-border rounded-lg',
  'placeholder:text-text-tertiary',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  'transition-colors duration-150'
);

const LABEL_CLASS = 'block text-xs font-medium text-text-secondary mb-1.5';

export const PaymentForm: React.FC<PaymentFormProps> = ({ plan }) => {
  const selectedPair = useAppStore((s) => s.selectedPair);
  const subtotal = plan.basePrice;
  const gst      = subtotal * GST_RATE;
  const total    = subtotal + gst;

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [company, setCompany]   = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setProcessing(true);

    try {
      const res = await paymentsService.initiate({
        amount:      Math.round(total * 100), // smallest currency unit (cents/paise)
        currency:    'AUD',
        description: `${plan.name} Migration Plan`,
        name:        name || undefined,
        email:       email || undefined,
        company:     company || undefined,
      });

      if (!res.paymentUrl) throw new Error('No payment URL returned by server.');

      // Persist the migration context so the success page can call POST /migrations
      // after Razorpay redirects back. sessionStorage survives the redirect chain.
      if (selectedPair?.id && plan.id) {
        sessionStorage.setItem(
          PENDING_MIGRATION_KEY,
          JSON.stringify({ migrationPairId: String(selectedPair.id), planId: plan.id }),
        );
      }

      // Hand off completely to the Razorpay hosted page.
      window.location.href = res.paymentUrl;
    } catch (err) {
      setProcessing(false);
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not initiate payment. Please try again.'
      );
    }
    // Note: we do NOT reset processing=true on success — the page navigates away.
  };

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-5">Complete payment</h3>

      {/* Plan recap */}
      <div className="bg-bg-light border border-border rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">{plan.name} plan</span>
          <span className="text-sm font-mono font-semibold text-text-primary">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
          <span>GST (10%)</span>
          <span className="font-mono">{formatCurrency(gst)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-semibold text-text-primary">Total (AUD)</span>
          <span className="text-base font-bold font-mono text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Your name</label>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={processing}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Billing email</label>
          <input
            type="email"
            className={INPUT_CLASS}
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={processing}
            required
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>
            Company name{' '}
            <span className="text-text-tertiary font-normal">(optional)</span>
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="Acme Accounting Pty Ltd"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={processing}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="pt-1">
          <Button type="submit" variant="primary" size="lg" fullWidth loading={processing} disabled={processing}>
            {processing ? 'Redirecting to payment…' : `Pay ${formatCurrency(total)} securely`}
          </Button>
          <div className="flex items-center justify-center gap-2 mt-3">
            <svg className="w-3.5 h-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-xs text-text-tertiary">Secured by Razorpay · 256-bit SSL · No card details stored here</p>
          </div>
        </div>
      </form>
    </div>
  );
};
