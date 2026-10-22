import React from 'react';
import { platformDisplayName } from '@/utils/platformName';
import type { Pair } from '@/types';

interface SelectedPairBannerProps {
  pair: Pair;
  className?: string;
}

/** Highlighted label of the pair the current migration flow is for. */
export const SelectedPairBanner: React.FC<SelectedPairBannerProps> = ({ pair, className = '' }) => (
  <div className={`flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 ${className}`}>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Selected migration</p>
      <p className="text-sm font-bold text-text-primary truncate">
        {platformDisplayName(pair.src)} <span className="text-text-tertiary">→</span> {platformDisplayName(pair.dst)}
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
