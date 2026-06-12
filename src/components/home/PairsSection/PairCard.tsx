import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '@/utils/format';
import { Badge } from '@/components/common/Badge';
import { PlatformMark } from '@/components/common/PlatformMark';
import { useAppStore } from '@/store/appStore';
import type { Pair } from '@/types';

interface PairCardProps {
  pair: Pair;
  index: number;
}

export const PairCard: React.FC<PairCardProps> = ({ pair, index }) => {
  const navigate = useNavigate();
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);

  const handleClick = () => {
    if (pair.url) {
      window.open(pair.url, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedPair(pair);
      navigate('/payment');
    }
  };

  const renderStatusBadge = () => {
    if (pair.isFree) {
      return <Badge variant="success">Free</Badge>;
    }
    if (pair.status === 'region') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="blue">Free in Australia</Badge>
          <Badge variant="gray">Paid elsewhere</Badge>
        </div>
      );
    }
    if (pair.plans.length > 0) {
      const minPrice = Math.min(...pair.plans.map((p) => p.basePrice));
      return (
        <span className="text-xs font-semibold font-mono text-text-primary">
          from {formatCurrency(minPrice)} USD
        </span>
      );
    }
    return <Badge variant="gray">Coming Soon</Badge>;
  };

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
        'hover:border-border-medium hover:shadow-card-hover',
        'transition-all duration-200',
        'flex flex-col gap-4'
      )}
    >
      {/* Platforms */}
      <div className="flex items-center gap-3">
        {/* Source platform */}
        <PlatformMark
          logo={pair.srcLogo}
          abbr={pair.srcAbbr}
          color={pair.srcColor}
          name={pair.src}
        />

        {/* Arrow */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <div className="h-px flex-1 bg-border" />
          <svg className="w-4 h-4 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Destination platform */}
        <PlatformMark
          logo={pair.dstLogo}
          abbr={pair.dstAbbr}
          color={pair.dstColor}
          name={pair.dst}
        />
      </div>

      {/* Title */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary">
          {pair.src} → {pair.dst}
        </h3>
        {pair.myobBusiness && (
          <p className="text-xs text-text-tertiary mt-0.5">MYOB Business only</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-mono font-medium">{pair.count}</span>
          <span>migrations</span>
        </div>
        {renderStatusBadge()}
      </div>

      {/* CTA hover state */}
      <div className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity -mt-2 flex items-center gap-1">
        {pair.url ? 'Open migration tool' : pair.isFree ? 'Start free migration' : 'Start migration'}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </motion.div>
  );
};
