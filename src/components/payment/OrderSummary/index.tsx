import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, yesNo } from '@/utils/format';
import { usePaymentSkipped } from '@/hooks/usePaymentSkipped';
import { calculateMigrationPeriod, formatFinancialRange } from '@/utils/financialYear';
import { useAppStore } from '@/store/appStore';
import { findSelectedPlan, isFreeSelection, planCurrency } from '@/constants/migrationFlow';
import { pairCustomerPath, pairPlanPath } from '@/utils/platformMap';

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 text-[13px] sm:px-5">
    <dt className="text-text-secondary">{label}</dt>
    <dd className="text-right font-semibold text-text-primary">{value}</dd>
  </div>
);

/** Order summary only — no personal details. Read straight from the flow state, so changing
 *  the plan or details and coming back always shows the recalculated figures. */
export const OrderSummary: React.FC = () => {
  const pair = useAppStore((s) => s.selectedPair);
  const selectedPlanId = useAppStore((s) => s.selectedPlanId);
  const inquiryDetails = useAppStore((s) => s.inquiryDetails);

  const plan = findSelectedPlan(pair, selectedPlanId);
  const isFree = isFreeSelection(pair, plan);
  // Operation Team: the plan is paid, but nothing is due at checkout.
  const paymentSkipped = usePaymentSkipped(pair?.isFree ?? false, plan);
  const currency = planCurrency(plan);

  const dateRange = plan
    ? formatFinancialRange(calculateMigrationPeriod(inquiryDetails?.financialYearEnd, plan.years, plan.isInception))
    : null;

  const total = isFree ? 'Free' : paymentSkipped ? 'Skipped' : `${formatCurrency(plan?.basePrice ?? 0)} ${currency}`;

  return (
    <section aria-labelledby="order-summary-title" className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-light px-4 py-3 sm:px-5">
        <h2 id="order-summary-title" className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Order Summary
        </h2>
        {pair && (
          <div className="flex items-center gap-3 text-xs font-medium">
            <Link to={pairPlanPath(pair)} className="text-blue-600 hover:underline">Change plan</Link>
            <Link to={pairCustomerPath(pair)} className="text-blue-600 hover:underline">Edit details</Link>
          </div>
        )}
      </div>

      <dl>
        <Row label="Migration pair" value={pair ? `${pair.src} → ${pair.dst}` : '—'} />
        {plan && (
          <>
            <Row label="Plan" value={plan.name} />
            <Row label="Historical data" value={plan.history} />
            {dateRange && <Row label="Date range" value={dateRange} />}
            {inquiryDetails?.financialYearEnd && <Row label="Financial year end" value={inquiryDetails.financialYearEnd} />}
            {inquiryDetails?.addOnsConfirmed != null && (
              <Row
                label="Add-ons"
                value={inquiryDetails?.addOnsConfirmed == null ? '—' : inquiryDetails.addOnsConfirmed ? `${yesNo(true)} — quoted separately` : 'None'}
              />
            )}
          </>
        )}
        <div className="flex items-center justify-between gap-4 bg-bg-light px-4 py-3.5 sm:px-5">
          <dt className="text-[13px] font-bold text-text-primary">Total due today</dt>
          <dd className={`font-mono text-base font-bold ${isFree || paymentSkipped ? 'text-green-600' : 'text-blue-600'}`}>{total}</dd>
        </div>
      </dl>
    </section>
  );
};
