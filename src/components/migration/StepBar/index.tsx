import React from 'react';
import { cn } from '@/utils/format';

const STEPS = [
  'Connect source',
  'Connect destination',
  'Select data',
  'Review',
  'Migration',
];

interface StepBarProps {
  currentStep: number; // 1-based
}

export const StepBar: React.FC<StepBarProps> = ({ currentStep }) => (
  <div className="flex items-center mb-10 select-none" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={5}>
    {STEPS.map((label, idx) => {
      const step = idx + 1;
      const isDone   = step < currentStep;
      const isActive = step === currentStep;

      return (
        <React.Fragment key={step}>
          {/* Step node */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300',
                isDone   && 'bg-green-50 border-green-500 text-green-600',
                isActive && 'bg-blue-50 border-blue-500 text-blue-600',
                !isDone && !isActive && 'bg-white border-border text-text-tertiary'
              )}
            >
              {isDone ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              className={cn(
                'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                isDone   && 'text-green-600',
                isActive && 'text-blue-600',
                !isDone && !isActive && 'text-text-tertiary'
              )}
            >
              {label}
            </span>
          </div>

          {/* Connector line (not after last) */}
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-px mx-2 mb-5 transition-colors duration-300',
                isDone ? 'bg-green-400' : 'bg-border'
              )}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);
