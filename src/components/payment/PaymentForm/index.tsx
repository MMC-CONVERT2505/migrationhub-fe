import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn, formatCurrency, formatCardNumber, formatExpiry } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { PLANS, GST_RATE } from '@/constants/plans';
import { useAppStore } from '@/store/appStore';
import type { PaymentFormData } from '@/types';

const COUNTRIES = [
  'Australia',
  'New Zealand',
  'United States',
  'United Kingdom',
  'Canada',
  'Singapore',
  'India',
  'UAE',
  'Other',
];

const INPUT_CLASS = cn(
  'w-full px-3 py-2.5 text-sm text-text-primary bg-white border border-border rounded-lg',
  'placeholder:text-text-tertiary',
  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
  'transition-colors duration-150'
);

const LABEL_CLASS = 'block text-xs font-medium text-text-secondary mb-1.5';

export const PaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const { selectedPlanIndex, startPaymentProcessing, paymentProcessing } = useAppStore((s) => ({
    selectedPlanIndex: s.selectedPlanIndex,
    startPaymentProcessing: s.startPaymentProcessing,
    paymentProcessing: s.paymentProcessing,
  }));

  const plan = PLANS[selectedPlanIndex];
  const total = plan.basePrice * (1 + GST_RATE);

  const [form, setForm] = useState<PaymentFormData>({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    billingEmail: '',
    company: '',
    country: 'Australia',
    postalCode: '',
  });

  const handleChange = (field: keyof PaymentFormData, value: string) => {
    let processed = value;
    if (field === 'cardNumber') processed = formatCardNumber(value);
    if (field === 'expiry') processed = formatExpiry(value);
    if (field === 'cvv') processed = value.replace(/\D/g, '').slice(0, 4);
    setForm((prev) => ({ ...prev, [field]: processed }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startPaymentProcessing();
    // Simulate payment processing then navigate
    setTimeout(() => {
      navigate('/migration');
    }, 2000);
  };

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-6">Payment details</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card section */}
        <div className="bg-bg-light border border-border rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">Card information</p>

          <div>
            <label className={LABEL_CLASS}>Cardholder name</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="John Smith"
              value={form.cardholderName}
              onChange={(e) => handleChange('cardholderName', e.target.value)}
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Card number</label>
            <div className="relative">
              <input
                type="text"
                className={cn(INPUT_CLASS, 'pr-12 font-mono')}
                placeholder="1234 5678 9012 3456"
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                required
                maxLength={19}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {['V', 'M', 'A'].map((brand) => (
                  <div
                    key={brand}
                    className="w-6 h-4 bg-bg-muted rounded text-[9px] font-bold text-text-tertiary flex items-center justify-center"
                  >
                    {brand}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Expiry date</label>
              <input
                type="text"
                className={cn(INPUT_CLASS, 'font-mono')}
                placeholder="MM/YY"
                value={form.expiry}
                onChange={(e) => handleChange('expiry', e.target.value)}
                required
                maxLength={5}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>CVV</label>
              <input
                type="text"
                className={cn(INPUT_CLASS, 'font-mono')}
                placeholder="123"
                value={form.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                required
                maxLength={4}
              />
            </div>
          </div>
        </div>

        {/* Billing info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">Billing information</p>

          <div>
            <label className={LABEL_CLASS}>Billing email</label>
            <input
              type="email"
              className={INPUT_CLASS}
              placeholder="you@company.com"
              value={form.billingEmail}
              onChange={(e) => handleChange('billingEmail', e.target.value)}
              required
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Company name</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="Acme Accounting Pty Ltd"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Country</label>
              <select
                className={INPUT_CLASS}
                value={form.country}
                onChange={(e) => handleChange('country', e.target.value)}
                required
              >
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Postal code</label>
              <input
                type="text"
                className={cn(INPUT_CLASS, 'font-mono')}
                placeholder="2000"
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={paymentProcessing}
            icon={
              !paymentProcessing ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : undefined
            }
          >
            {paymentProcessing
              ? 'Processing payment...'
              : `Pay ${formatCurrency(total)} — Start Migration`}
          </Button>

          <p className="text-center text-xs text-text-tertiary mt-3">
            🔒 Secured by 256-bit SSL · All major cards accepted
          </p>
        </div>
      </form>
    </div>
  );
};
