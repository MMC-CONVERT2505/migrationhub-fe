import React from 'react';
import { formatCurrency } from '@/utils/format';
import { calculateMigrationPeriod, formatFinancialRange } from '@/utils/financialYear';
import { useAppStore } from '@/store/appStore';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '11px 18px',
    borderBottom: '1px solid #dce2ef',
    fontSize: 13,
  }}>
    <span style={{ color: '#4b5568' }}>{label}</span>
    <span style={{ fontWeight: 600, color: '#111827' }}>{value}</span>
  </div>
);

export const OrderSummary: React.FC = () => {
  const selectedPair = useAppStore((s) => s.selectedPair);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const inquiryDetails = useAppStore((s) => s.inquiryDetails);

  const pair = selectedPair;
  const isFree = pair?.isFree ?? false;
  const plan = pair?.plans.find((p) => p.id === selectedPlanId) ?? null;

  // Migration date range derived from the customer's financial-year-end + the
  // plan's coverage — mirrors what the backend stores at migration creation.
  const dateRange = plan
    ? formatFinancialRange(
      calculateMigrationPeriod(
        inquiryDetails?.financialYearEnd,
        plan.years,
        plan.isInception,
      ),
    )
    : null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #dce2ef',
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 24,
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 18px',
        borderBottom: '1px solid #dce2ef',
        fontSize: 11,
        fontWeight: 600,
        color: '#4b5568',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        background: '#f0f4fa',
      }}>
        Order Summary
      </div>

      <Row label="Migration pair" value={pair ? `${pair.src} → ${pair.dst}` : '—'} />

      {plan ? (
        <>
          <Row label="Plan" value={plan.name} />
          <Row label="Historical data" value={plan.history} />
          {inquiryDetails?.financialYearEnd && <Row label="Financial year end" value={inquiryDetails.financialYearEnd} />}
          {dateRange && <Row label="Date range" value={dateRange} />}
          <Row label="Support tier" value={plan.support} />
          <Row label="Subtotal" value={isFree ? 'Free' : `${formatCurrency(plan.basePrice)} USD`} />
          {/* Total row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '13px 18px',
            background: '#f0f4fa',
            fontSize: 13,
          }}>
            <span style={{ fontWeight: 700, color: '#111827' }}>Total due today</span>
            <span style={{
              fontSize: 16,
              fontWeight: 700,
              color: isFree ? '#16a34a' : '#2563eb',
              fontFamily: 'monospace',
            }}>
              {isFree ? 'Free' : `${formatCurrency(plan.basePrice)} USD`}
            </span>
          </div>
        </>
      ) : (
        <div style={{ padding: '16px 18px', fontSize: 13, color: '#9ba3b8' }}>
          Select a plan above to see the order summary.
        </div>
      )}
    </div>
  );
};
