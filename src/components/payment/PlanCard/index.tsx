import React from 'react';
import { formatCurrency, cn } from '@/utils/format';
import { FREE_PAIR_BENEFITS, planCurrency } from '@/constants/migrationFlow';
import type { Plan } from '@/types';

interface PlanCardProps {
  plan: Plan;
  /** Shared radio-group name, so the cards behave as one native radio group. */
  name: string;
  selected: boolean;
  onSelect: (planId: string) => void;
  /** A free pair's plan: only the history and what's included — no plan name, price or support line. */
  freePairBenefits?: boolean;
}

/** One selectable plan. A native radio inside a label, so selection and arrow-key
 *  navigation come from the browser and are announced by screen readers. */
export const PlanCard: React.FC<PlanCardProps> = ({ plan, name, selected, onSelect, freePairBenefits = false }) => {
  const free = Number(plan.basePrice) === 0;
  return (
    <label
      className={cn(
        'relative flex items-start gap-3 rounded-xl border-[1.5px] bg-white p-4 sm:p-5 cursor-pointer transition-colors',
        'focus-within:ring-2 focus-within:ring-blue-500/40',
        selected ? 'border-blue-600 bg-blue-50/50' : 'border-border hover:border-border-medium',
      )}
    >
      <input
        type="radio"
        name={name}
        value={plan.id}
        checked={selected}
        onChange={() => plan.id && onSelect(plan.id)}
        className="mt-1 h-4 w-4 flex-shrink-0 accent-blue-600"
      />

      {plan.popular && (
        <span className="absolute -top-px right-4 rounded-b-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Most popular
        </span>
      )}

      <div className="min-w-0 flex-1">
        {freePairBenefits ? (
          <>
            {/* The plan name stays available to assistive tech even though it isn't shown. */}
            <span className="sr-only">{plan.name} plan</span>
            <p className="text-sm font-bold text-text-primary">{plan.history} history</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Included">
              {FREE_PAIR_BENEFITS.map((f) => (
                <li key={f} className="rounded border border-border bg-bg-lighter px-2 py-0.5 text-[11px] text-text-secondary">{f}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">{plan.name}</p>
            <p className="mt-0.5 text-[11px] font-medium text-text-secondary">{plan.history} history</p>
          </div>
          <div className="text-right flex-shrink-0">
            {free ? (
              <p className="font-mono text-lg font-bold text-green-600">Free</p>
            ) : (
              <>
                <p className="font-mono text-lg font-bold text-text-primary">{formatCurrency(plan.basePrice)}</p>
                <p className="mt-0.5 text-[10.5px] text-text-tertiary">one-time · {planCurrency(plan)}</p>
              </>
            )}
          </div>
        </div>

        {plan.support && <p className="mt-2 text-[12.5px] leading-snug text-text-secondary">{plan.support}</p>}

        {plan.features.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`${plan.name} includes`}>
            {plan.features.map((f) => (
              <li key={f} className="rounded border border-border bg-bg-lighter px-2 py-0.5 text-[11px] text-text-secondary">
                {f}
              </li>
            ))}
          </ul>
        )}
          </>
        )}
      </div>
    </label>
  );
};
