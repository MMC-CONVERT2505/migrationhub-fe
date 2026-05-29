import React from 'react';
import { motion } from 'framer-motion';
import { cn, formatCurrency } from '@/utils/format';
import { Badge } from '@/components/common/Badge';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, index, selected, onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => onSelect(index)}
      className={cn(
        'relative border rounded-xl p-5 cursor-pointer transition-all duration-200',
        selected
          ? 'border-blue-500 bg-blue-light shadow-elevated ring-1 ring-blue-500'
          : 'border-border bg-white hover:border-border-medium hover:shadow-card'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="blue" className="px-3 py-1 text-xs font-semibold">
            ⭐ Most popular
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-text-primary">{plan.name}</h3>
          <p className="text-xs text-text-tertiary mt-0.5">{plan.history} history</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-text-primary font-mono">
            {formatCurrency(plan.basePrice)}
          </p>
          <p className="text-xs text-text-tertiary">AUD + GST</p>
        </div>
      </div>

      <div className="space-y-2">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2">
            <svg
              className={cn(
                'w-4 h-4 flex-shrink-0',
                selected ? 'text-blue-600' : 'text-green-500'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-text-secondary">{feature}</span>
          </div>
        ))}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );
};
