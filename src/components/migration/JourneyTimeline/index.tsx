import React from 'react';
import { cn } from '@/utils/format';
import type { JourneyStage, JourneyStageState } from '@/types/api';

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : null;

interface NodeStyle {
  ring: string;   // node border + bg
  icon: React.ReactNode;
  label: string;  // label text color
  line: string;   // connector line color below the node
}

const Check = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const Cross = (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const styleFor = (state: JourneyStageState): NodeStyle => {
  switch (state) {
    case 'completed':
      return { ring: 'bg-green-50 border-green-500 text-green-600', icon: Check, label: 'text-text-primary', line: 'bg-green-400' };
    case 'active':
      return { ring: 'bg-blue-600 border-blue-600 text-white', icon: <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />, label: 'text-blue-700 font-semibold', line: 'bg-border' };
    case 'failed':
      return { ring: 'bg-red-50 border-red-500 text-red-600', icon: Cross, label: 'text-red-700 font-semibold', line: 'bg-border' };
    case 'skipped':
      return { ring: 'bg-bg-light border-border text-text-tertiary', icon: <span className="w-2.5 h-px bg-text-tertiary" />, label: 'text-text-tertiary', line: 'bg-border' };
    default: // pending
      return { ring: 'bg-white border-border text-text-tertiary', icon: <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary/40" />, label: 'text-text-tertiary', line: 'bg-border' };
  }
};

/** Presentational vertical stepper for the server-computed migration journey.
 *  Shared by the admin tracing page and the customer tracking page. */
export const JourneyTimeline: React.FC<{ stages: JourneyStage[] }> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return <p className="text-sm text-text-tertiary">No journey data available.</p>;
  }

  return (
    <ol className="relative">
      {stages.map((stage, i) => {
        const s = styleFor(stage.state);
        const isLast = i === stages.length - 1;
        const when = fmt(stage.at);

        return (
          <li key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Connector line */}
            {!isLast && (
              <span
                className={cn('absolute left-[15px] top-8 bottom-0 w-px -translate-x-1/2', s.line)}
                aria-hidden
              />
            )}

            {/* Node */}
            <span
              className={cn(
                'relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                s.ring,
              )}
            >
              {s.icon}
            </span>

            {/* Body */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-3">
                <p className={cn('text-sm leading-tight', s.label)}>{stage.label}</p>
                {when && <time className="text-xs text-text-tertiary whitespace-nowrap flex-shrink-0">{when}</time>}
              </div>
              {stage.detail && (
                <p className={cn('text-xs mt-0.5 break-words', stage.state === 'failed' ? 'text-red-600' : 'text-text-secondary')}>
                  {stage.detail}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default JourneyTimeline;
