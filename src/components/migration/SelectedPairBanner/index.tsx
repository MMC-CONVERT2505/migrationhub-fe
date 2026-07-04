import React from 'react';
import { PlatformMark } from '@/components/common/PlatformMark';
import type { Pair } from '@/types';

interface SelectedPairBannerProps {
  pair: Pair;
  className?: string;
}

/** Highlighted label of the pair the current migration flow is for. */
export const SelectedPairBanner: React.FC<SelectedPairBannerProps> = ({ pair, className = '' }) => (
  <div className={`flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 ${className}`}>
    <div className="flex items-center gap-2 flex-shrink-0">
      <PlatformMark
        logo={pair.srcLogo}
        abbr={pair.srcAbbr}
        color={pair.srcColor}
        name={pair.src}
        className="w-9 h-9 rounded-lg"
        textClassName="text-[10px] font-extrabold"
      />
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      <PlatformMark
        logo={pair.dstLogo}
        abbr={pair.dstAbbr}
        color={pair.dstColor}
        name={pair.dst}
        className="w-9 h-9 rounded-lg"
        textClassName="text-[10px] font-extrabold"
      />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Selected migration</p>
      <p className="text-sm font-bold text-text-primary truncate">
        {pair.src} <span className="text-text-tertiary">→</span> {pair.dst}
      </p>
    </div>
    <span
      className={
        'ml-auto flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ' +
        (pair.isFree ? 'bg-green-100 text-green-700' : 'bg-white border border-border text-text-secondary')
      }
    >
      {pair.isFree ? '🔥 Free' : '🏷️ Paid'}
    </span>
  </div>
);
