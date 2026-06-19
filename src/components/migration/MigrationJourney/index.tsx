import React from 'react';
import { cn } from '@/utils/format';

export const JOURNEY_STEPS = [
  'Select Pair',
  'Migration Details',
  'FAQ',
  'Plan & Payment',
  'Summary',
  'Connect Source',
  'Connect Destination',
  'Start Migration',
  'Completed',
] as const;

export type JourneyStep = number; // 1-based, 1..JOURNEY_STEPS.length

/** 1-based index of a step by label — keeps the constants below in sync with
 *  JOURNEY_STEPS so reordering the array can never desync the step numbers. */
const stepOf = (label: (typeof JOURNEY_STEPS)[number]): JourneyStep =>
  JOURNEY_STEPS.indexOf(label) + 1;

/** "Plan & Payment" — the last paid step this orchestration frontend collects. */
export const PAYMENT_STEP = stepOf('Plan & Payment');

/** "Summary" — the post-payment summary page shown by this app. Marked active
 *  while the user reviews their order before being handed off to the tool. */
export const SUMMARY_STEP = stepOf('Summary');

/** "Connect Source" — first step owned by the remote migration tool. Passed to
 *  the tool via the `journeyStep` query param so it resumes there. */
export const HANDOFF_STEP = stepOf('Connect Source');

interface MigrationJourneyProps {
  current: JourneyStep;
  className?: string;
}

export const MigrationJourney: React.FC<MigrationJourneyProps> = ({ current, className }) => (
  <div
    className={cn('w-full overflow-x-auto', className)}
    role="progressbar"
    aria-valuenow={current}
    aria-valuemin={1}
    aria-valuemax={JOURNEY_STEPS.length}
  >
    <div className="flex items-start min-w-[720px]">
      {JOURNEY_STEPS.map((label, idx) => {
        const step = idx + 1;
        const isDone = step < current;
        const isActive = step === current;

        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center flex-shrink-0 w-[72px]">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300',
                  isDone && 'bg-green-50 border-green-500 text-green-600',
                  isActive && 'bg-blue-600 border-blue-600 text-white shadow-sm',
                  !isDone && !isActive && 'bg-white border-border text-text-tertiary',
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
                  'mt-1.5 text-[10px] font-medium text-center leading-tight',
                  isDone && 'text-green-600',
                  isActive && 'text-blue-700',
                  !isDone && !isActive && 'text-text-tertiary',
                )}
              >
                {label}
              </span>
            </div>

            {idx < JOURNEY_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mt-4 transition-colors duration-300',
                  step < current ? 'bg-green-400' : 'bg-border',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);
