import React from 'react';
import { motion } from 'framer-motion';
import { cn, formatNumber } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { DATA_CATEGORIES } from '@/constants/pairs';
import { useAppStore } from '@/store/appStore';

interface DataSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

export const DataSelector: React.FC<DataSelectorProps> = ({ onNext, onBack }) => {
  const { selectedDataCategories, toggleDataCategory } = useAppStore((s) => ({
    selectedDataCategories: s.selectedDataCategories,
    toggleDataCategory: s.toggleDataCategory,
  }));

  const allSelected = selectedDataCategories.length === DATA_CATEGORIES.length;
  const noneSelected = selectedDataCategories.length === 0;

  const toggleAll = () => {
    if (allSelected) {
      DATA_CATEGORIES.forEach((_, i) => {
        if (selectedDataCategories.includes(i)) toggleDataCategory(i);
      });
    } else {
      DATA_CATEGORIES.forEach((_, i) => {
        if (!selectedDataCategories.includes(i)) toggleDataCategory(i);
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">Select data to migrate</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Choose categories to include. Record counts are estimates from your source account.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card mb-6">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_140px_52px] gap-3 px-4 py-2.5 bg-bg-light border-b border-border">
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Data category</span>
          <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Est. records</span>
          <button
            onClick={toggleAll}
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 text-center transition-colors"
          >
            {allSelected ? 'None' : 'All'}
          </button>
        </div>

        {/* Rows */}
        {DATA_CATEGORIES.map((cat, i) => {
          const isSelected = selectedDataCategories.includes(i);
          return (
            <button
              key={cat.name}
              onClick={() => toggleDataCategory(i)}
              className={cn(
                'w-full grid grid-cols-[1fr_140px_52px] gap-3 items-center px-4 py-3 border-b border-border last:border-0 transition-colors text-left',
                isSelected ? 'bg-blue-50/50' : 'bg-white hover:bg-bg-light'
              )}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
                <span className="text-base w-5 text-center">{cat.icon}</span>
                {cat.name}
              </div>
              <span className="text-xs text-text-secondary font-mono">
                {formatNumber(cat.estimatedRecords)} records
              </span>
              <div className="flex justify-center">
                <div
                  className={cn(
                    'w-4.5 h-4.5 rounded border flex items-center justify-center transition-all',
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-border bg-white'
                  )}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-xs text-text-tertiary font-mono">
            {selectedDataCategories.length} / {DATA_CATEGORIES.length} selected
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onNext}
            disabled={noneSelected}
          >
            Continue →
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
