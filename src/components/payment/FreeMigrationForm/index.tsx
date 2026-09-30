import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

export const FreeMigrationForm: React.FC = () => {
  const navigate           = useNavigate();
  const selectedPair       = useAppStore((s) => s.selectedPair);
  const selectedPlanId     = useAppStore((s) => s.selectedPlanId);
  const inquiryDetails     = useAppStore((s) => s.inquiryDetails);
  const setPendingMigration = useAppStore((s) => s.setPendingMigration);

  const [error, setError] = useState('');

  const plan = selectedPair?.plans.find((p) => p.id === selectedPlanId) ?? null;

  const handleStart = () => {
    if (!selectedPair?.id || !selectedPlanId) {
      setError('Migration pair or plan is missing. Please go back and try again.');
      return;
    }
    // Persist to localStorage (not just the in-memory/sessionStorage store) so
    // /payment/success can build a valid create-migration request even if it
    // loads in a context where the live store snapshot isn't available —
    // mirrors what PaymentForm already does before its Razorpay redirect.
    setPendingMigration({
      migrationPairId: String(selectedPair.id),
      planId: selectedPlanId,
      ...(inquiryDetails?.id ? { inquiryId: inquiryDetails.id } : {}),
    });
    navigate('/payment/success');
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #dce2ef', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #dce2ef', background: '#f0f4fa' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 20,
          padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#15803d', marginBottom: 8,
        }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Free migration
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>No payment required</h3>
        <p style={{ fontSize: 12, color: '#4b5568', marginTop: 2 }}>Start your migration immediately</p>
      </div>

      <div style={{ padding: 22 }}>
        {/* Selected plan recap */}
        {plan && (
          <div style={{
            background: '#f0f4fa', border: '1px solid #dce2ef', borderRadius: 8,
            padding: '12px 14px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 11, color: '#9ba3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: 600 }}>
                Selected plan
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{plan.name}</p>
              <p style={{ fontSize: 11.5, color: '#4b5568', marginTop: 2 }}>
                {plan.history} history · {plan.support}
              </p>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', fontFamily: 'monospace' }}>Free</span>
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, marginBottom: 14,
          }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="#ef4444" style={{ flexShrink: 0, marginTop: 1 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            background: '#16a34a',
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
            fontFamily: 'inherit',
          }}
        >
          Start migration
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p style={{ textAlign: 'center', fontSize: 11.5, color: '#9ba3b8', marginTop: 10 }}>
          Your migration will begin immediately after confirmation.
        </p>
      </div>
    </div>
  );
};
