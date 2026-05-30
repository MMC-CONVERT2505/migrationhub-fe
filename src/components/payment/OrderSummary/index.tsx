import React from 'react';
import { formatCurrency } from '@/utils/format';
import { PLANS, GST_RATE } from '@/constants/plans';
import { useAppStore } from '@/store/appStore';
import type { Plan } from '@/types';

interface OrderSummaryProps {
  /** Live plan list from API (or falls back to PLANS constant internally). */
  uiPlans?: Plan[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ uiPlans }) => {
  const selectedPlanIndex = useAppStore((s) => s.selectedPlanIndex);
  const selectedPair      = useAppStore((s) => s.selectedPair);

  const plans  = uiPlans?.length ? uiPlans : PLANS;
  const plan   = plans[selectedPlanIndex] ?? plans[0];
  const pair   = selectedPair;

  const subtotal = plan.basePrice;
  const gst      = subtotal * GST_RATE;
  const total    = subtotal + gst;

  return (
    <div className="bg-white border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4">Order summary</h3>

      {/* Pair */}
      {pair && (
        <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs flex-shrink-0"
            style={{ backgroundColor: pair.srcColor }}
          >
            {pair.srcAbbr}
          </div>
          <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold font-mono text-xs flex-shrink-0"
            style={{ backgroundColor: pair.dstColor }}
          >
            {pair.dstAbbr}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {pair.src} → {pair.dst}
            </p>
            {pair.count && (
              <p className="text-xs text-text-tertiary">{pair.count} migrations done</p>
            )}
          </div>
        </div>
      )}

      {/* Plan details */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">{plan.name} plan</span>
          <span className="text-sm font-medium text-text-primary font-mono">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">History included</span>
          <span className="text-sm text-text-secondary">{plan.history}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Support</span>
          <span className="text-sm text-text-secondary text-right max-w-[160px]">{plan.support}</span>
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Subtotal</span>
          <span className="text-sm font-medium text-text-primary font-mono">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">GST (10%)</span>
          <span className="text-sm font-medium text-text-primary font-mono">{formatCurrency(gst)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="font-semibold text-text-primary">Total</span>
          <span className="font-bold text-lg text-text-primary font-mono">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Trust signals */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        {[
          '🔒 256-bit SSL encryption',
          '🛡️ SOC 2 Type II certified',
          '🔄 30-day support included',
        ].map((item) => (
          <div key={item} className="text-xs text-text-tertiary flex items-center gap-1.5">
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
