import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/format';
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
  const navigate = useNavigate();
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);

  const handleClick = () => {
    if (pair.url) {
      window.open(pair.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedPair(pair);
      navigate('/migration/details');
    }
  };

  const renderBadges = () => {
    if (pair.status === 'region') {
      return (
        <>
          <Pill className="bg-blue-50 text-blue-700">Free in Australia</Pill>
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.08 }}
      whileHover={{ y: -2 }}
      onClick={handleClick}
      className={cn(
        'group bg-white border border-border rounded-xl p-5 cursor-pointer',
        'hover:border-border-medium hover:shadow-card-hover transition-all duration-200',
        'flex flex-col',
      )}
    >
      {/* Platforms */}
      <div className="flex items-center gap-2">
        <PairLogoBox logo={pair.srcLogo} abbr={pair.srcAbbr} name={pair.src} color={pair.srcColor} />
        <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <PairLogoBox logo={pair.dstLogo} abbr={pair.dstAbbr} name={pair.dst} color={pair.dstColor} />
      </div>

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
        <span className={cn('text-sm font-semibold', action.cls)}>{action.label}</span>
      </div>
    </motion.div>
  );
};
