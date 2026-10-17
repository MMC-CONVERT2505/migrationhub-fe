import React from 'react';
import { cn } from '@/utils/format';
import { FLOW_STEPS, flowStepNumber, type FlowPage } from '@/constants/migrationFlow';

interface FlowStepperProps {
  page: FlowPage;
  className?: string;
}

/** 4-step Prepare → Pay → Connect → Migrate progress. A labelled ordered list, with the
 *  current step flagged via aria-current so screen readers announce position and state. */
export const FlowStepper: React.FC<FlowStepperProps> = ({ page, className }) => {
  const current = flowStepNumber(page);

  return (
    <nav aria-label="Migration progress" className={cn('w-full', className)}>
      <ol className="flex items-start">
        {FLOW_STEPS.map((step, idx) => {
          const n = idx + 1;
          const done = n < current;
          const active = n === current;
          return (
            <React.Fragment key={step.key}>
              <li
                aria-current={active ? 'step' : undefined}
                className="flex flex-col items-center flex-shrink-0 w-16 sm:w-20"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors',
                    done && 'bg-green-50 border-green-500 text-green-600',
                    active && 'bg-blue-600 border-blue-600 text-white shadow-sm',
                    !done && !active && 'bg-white border-border text-text-tertiary',
                  )}
                >
                  {done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    n
                  )}
                </span>
                <span
                  className={cn(
                    'mt-1.5 text-[11px] font-medium text-center leading-tight',
                    done && 'text-green-600',
                    active && 'text-blue-700',
                    !done && !active && 'text-text-tertiary',
                  )}
                >
                  {step.label}
                  <span className="sr-only">{done ? ' (completed)' : active ? ' (current step)' : ' (upcoming)'}</span>
                </span>
              </li>
              {idx < FLOW_STEPS.length - 1 && (
                <li
                  role="presentation"
                  aria-hidden="true"
                  className={cn('flex-1 h-px mt-4 transition-colors', n < current ? 'bg-green-400' : 'bg-border')}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
