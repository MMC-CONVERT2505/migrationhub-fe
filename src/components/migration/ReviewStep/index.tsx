import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { PLANS } from '@/constants/plans';
import { DATA_CATEGORIES } from '@/constants/pairs';
import { useAppStore } from '@/store/appStore';
import { formatCurrency } from '@/utils/format';
import type { Pair } from '@/types';

interface ReviewStepProps {
  pair: Pair;
  onStart: () => void;
  onBack: () => void;
}

const SummaryCard: React.FC<{
  title: string;
  rows: { label: string; value: React.ReactNode }[];
}> = ({ title, rows }) => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
    <div className="px-4 py-2.5 bg-bg-light border-b border-border">
      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{title}</span>
    </div>
    <div>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
          <span className="text-sm text-text-secondary">{label}</span>
          <span className="text-sm font-semibold text-text-primary">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

export const ReviewStep: React.FC<ReviewStepProps> = ({ pair, onStart, onBack }) => {
  const { selectedPlanIndex, selectedDataCategories } = useAppStore((s) => ({
    selectedPlanIndex: s.selectedPlanIndex,
    selectedDataCategories: s.selectedDataCategories,
  }));

  const plan = PLANS[selectedPlanIndex];
  const totalPrice = plan.basePrice * 1.1;

  const totalRecords = DATA_CATEGORIES
    .filter((_, i) => selectedDataCategories.includes(i))
    .reduce((sum, cat) => sum + cat.estimatedRecords, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Review and confirm</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Verify all details before starting. Return to any step to make changes.
        </p>
      </div>

      {/* Two-column platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SummaryCard
          title="Source"
          rows={[
            { label: 'Platform',     value: pair.src },
            { label: 'Organisation', value: 'Acme Accounting Pty Ltd' },
            { label: 'Region',       value: 'Australia' },
            {
              label: 'Connection',
              value: (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  ✓ Verified
                </span>
              ),
            },
          ]}
        />
        <SummaryCard
          title="Destination"
          rows={[
            { label: 'Platform',     value: pair.dst },
            { label: 'Organisation', value: 'Acme Accounting Pty Ltd' },
            { label: 'Region',       value: 'Australia' },
            {
              label: 'Connection',
              value: (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                  ✓ Verified
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Scope card */}
      <SummaryCard
        title="Migration scope"
        rows={[
          { label: 'Data categories',    value: `${selectedDataCategories.length} of ${DATA_CATEGORIES.length}` },
          { label: 'Estimated records',  value: `~${totalRecords.toLocaleString()}` },
          { label: 'Est. duration',      value: '15–25 minutes' },
          { label: 'Plan',               value: plan.name },
          {
            label: 'Payment',
            value: (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                ✓ Paid — {formatCurrency(totalPrice)}
              </span>
            ),
          },
        ]}
      />

      {/* Warning */}
      <div className="flex items-start gap-3 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Before proceeding:</strong> Export a backup of your destination account. This migration writes new records and does not delete any existing data in your destination platform.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <Button variant="primary" size="md" onClick={onStart}>
          Start migration
        </Button>
      </div>
    </motion.div>
  );
};
