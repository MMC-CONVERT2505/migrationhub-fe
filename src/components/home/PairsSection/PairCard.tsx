import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { platformDisplayName, pairDisplayName } from '@/utils/platformName';
import { cn } from '@/utils/format';
import { pairDetailsPath } from '@/utils/platformMap';
import { useAppStore } from '@/store/appStore';
import type { Pair } from '@/types';

interface PairCardProps {
  pair: Pair;
  index: number;
}

/** A platform logo inside a white card; falls back to its abbreviation. */
const PairLogoBox: React.FC<{
  logo?: string | null;
  abbr: string;
  name: string;
  color: string;
}> = ({ logo, abbr, name, color }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex-1 min-w-0 h-14 flex items-center justify-center bg-white border border-border rounded-lg px-2">
      {logo && !failed ? (
        <img
          src={logo}
          alt={name}
          title={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-8 max-w-full object-contain"
        />
      ) : (
        <span className="text-xs font-bold font-mono truncate" style={{ color }}>
          {abbr}
        </span>
      )}
    </div>
  );
};

const Pill: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', className)}>
    {children}
  </span>
);

export const PairCard: React.FC<PairCardProps> = ({ pair, index }) => {
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);

  const renderBadges = () => {
    if (pair.status === 'region') {
      return (
        <>
          <Pill className="bg-blue-50 text-blue-700">{`Free in ${(pair.freeCountries ?? ['Australia']).join(', ')}`}</Pill>
          <Pill className="bg-bg-light text-text-secondary border border-border">Paid elsewhere</Pill>
        </>
      );
    }
    if (pair.status === 'free' || pair.isFree) {
      return <Pill className="bg-green-50 text-green-700">🔥 Free</Pill>;
    }
    return <Pill className="bg-bg-light text-text-secondary border border-border">🏷️ Paid</Pill>;
  };

  const action =
    pair.status === 'region'
      ? { label: 'Check your region →', cls: 'text-orange-500' }
      : pair.status === 'free' || pair.isFree
        ? { label: 'Start free →', cls: 'text-green-600' }
        : { label: 'See pricing →', cls: 'text-blue-600' };

  const actionName = action.label.replace(/\s*→$/, '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.08 }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative bg-white border border-border rounded-xl p-5 cursor-pointer',
        'focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2',
        'hover:border-border-medium hover:shadow-card-hover transition-all duration-200',
        'flex flex-col',
      )}
    >
      {/* Platforms */}
      <div className="flex items-center gap-2">
        <PairLogoBox logo={pair.srcLogo} abbr={pair.srcAbbr} name={platformDisplayName(pair.src)} color={pair.srcColor} />
        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <PairLogoBox logo={pair.dstLogo} abbr={pair.dstAbbr} name={platformDisplayName(pair.dst)} color={pair.dstColor} />
      </div>

      <p className="mt-3 text-sm font-semibold text-text-primary">
        {/* The whole card is the link's hit area (::after); one link keeps tab order and screen-reader lists clean. */}
        {pair.url ? (
          <a
            href={pair.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${pairDisplayName(pair)}: ${actionName} (opens in a new tab)`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {pairDisplayName(pair)}
          </a>
        ) : (
          <Link
            to={pairDetailsPath(pair)}
            onClick={() => setSelectedPair(pair)}
            aria-label={`${pairDisplayName(pair)}: ${actionName}`}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {pairDisplayName(pair)}
          </Link>
        )}
      </p>

      {/* MYOB Business note */}
      {pair.myobBusiness && (
        <p className="mt-3 text-[11px] text-text-tertiary">* MYOB Business</p>
      )}

      {/* Status badges */}
      <div className={cn('flex items-center gap-2 flex-wrap', pair.myobBusiness ? 'mt-2' : 'mt-4')}>
        {renderBadges()}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          {pair.count ? `${pair.count} completed` : ''}
        </span>
        <span aria-hidden className={cn('text-sm font-semibold', action.cls)}>{action.label}</span>
      </div>
    </motion.div>
  );
};
