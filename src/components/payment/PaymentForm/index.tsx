import React, { useState } from 'react';
import { formatCurrency } from '@/utils/format';
import { paymentsService } from '@/api/payments';
import { ApiError } from '@/api/client';
import { useAppStore } from '@/store/appStore';

const FIELD: React.CSSProperties = {
  width: '100%',
  background: '#edf0f7',
  border: '1.5px solid #c8d0e7',
  borderRadius: 7,
  padding: '9px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  color: '#111827',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#4b5568',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

export const PaymentForm: React.FC = () => {
  const selectedPair        = useAppStore((s) => s.selectedPair);
  const selectedPlanId      = useAppStore((s) => s.selectedPlanId);
  const setPendingMigration = useAppStore((s) => s.setPendingMigration);

  const plan = selectedPair?.plans.find((p) => p.id === selectedPlanId) ?? null;

  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [company, setCompany]     = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedPair?.id || !plan?.id) {
      setError('Migration pair or plan is missing. Please go back and try again.');
      return;
    }

    setProcessing(true);
    try {
      const migrationPairId = String(selectedPair.id);
      const planId          = plan.id;
      const amount          = Math.round(parseFloat(String(plan.basePrice)) * 100);

      const res = await paymentsService.initiate({
        amount, migrationPairId, planId,
        currency:    'USD',
        description: `${plan.name} Migration Plan`,
        name:        name || undefined,
        email:       email || undefined,
        company:     company || undefined,
      });

      if (!res.paymentUrl) throw new Error('No payment URL returned by server.');

      setPendingMigration({ migrationPairId, planId });
      window.location.href = res.paymentUrl;
    } catch (err) {
      setProcessing(false);
      setError(err instanceof ApiError ? err.message : 'Could not initiate payment. Please try again.');
    }
  };

  if (!plan) return null;

  if (processing) {
    return (
      <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div className="animate-spin" style={{ width: 36, height: 36, border: '3px solid #dce2ef', borderTopColor: '#2563eb', borderRadius: '50%' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Processing payment…</h3>
            <p style={{ fontSize: 13, color: '#4b5568', marginTop: 5 }}>Please wait, do not close this window.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #dce2ef', background: '#f0f4fa' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Payment Details</h3>
        <p style={{ fontSize: 12, color: '#4b5568', marginTop: 2 }}>Your information is encrypted and secure</p>
      </div>

      <div style={{ padding: 22 }}>
        {/* Card brand logos */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL'].map((brand) => (
            <span key={brand} style={{
              background: '#f0f4fa',
              border: '1px solid #dce2ef',
              borderRadius: 4,
              padding: '3px 7px',
              fontSize: 10,
              fontWeight: 700,
              color: '#4b5568',
              letterSpacing: 0.3,
            }}>
              {brand}
            </span>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div>
            <label style={LABEL}>Your name</label>
            <input style={FIELD} type="text" placeholder="John Smith" value={name} onChange={(e) => setName(e.target.value)} disabled={processing} required />
          </div>

          <div>
            <label style={LABEL}>Billing email</label>
            <input style={FIELD} type="email" placeholder="billing@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={processing} required />
          </div>

          <div>
            <label style={LABEL}>
              Company name{' '}
              <span style={{ color: '#9ba3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input style={FIELD} type="text" placeholder="Acme Accounting Pty Ltd" value={company} onChange={(e) => setCompany(e.target.value)} disabled={processing} />
          </div>

          <div style={{ height: 1, background: '#dce2ef', margin: '5px 0' }} />

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#ef4444" style={{ flexShrink: 0, marginTop: 1 }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            style={{
              width: '100%',
              background: '#2563eb',
              border: 'none',
              color: '#fff',
              padding: 13,
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              marginTop: 4,
              fontFamily: 'inherit',
            }}
          >
            <span>🔒</span>
            {`Pay ${formatCurrency(plan.basePrice)} USD — Start Migration`}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9ba3b8', margin: '2px 0 0' }}>
            256-bit SSL · Powered by Razorpay · No card details stored here
          </p>
        </form>
      </div>
    </div>
  );
};
