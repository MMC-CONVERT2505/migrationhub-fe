import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import { PAIRS } from '@/constants/pairs';
import { migrationPairsService } from '@/api/migrationPairs';
import { PairCard } from './PairCard';
import type { Pair } from '@/types';
import type { MigrationPairEntity } from '@/types/api';

// ─── Skeleton card ────────────────────────────────────────────────────────────
const PairCardSkeleton: React.FC = () => (
  <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-bg-lighter flex-shrink-0" />
      <div className="flex-1 h-px bg-bg-lighter" />
      <div className="w-12 h-12 rounded-xl bg-bg-lighter flex-shrink-0" />
    </div>
    <div className="space-y-1.5">
      <div className="h-3.5 w-32 bg-bg-lighter rounded" />
      <div className="h-3 w-20 bg-bg-lighter rounded" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <div className="h-3 w-24 bg-bg-lighter rounded" />
      <div className="h-5 w-14 bg-bg-lighter rounded-full" />
    </div>
  </div>
);

export const PairsSection: React.FC = () => {
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    migrationPairsService
      .available()
      .then((res) => {
        const items = extractList<MigrationPairEntity>(res);
        if (items.length > 0) {
          setPairs(items.map(apiPairToUiPair));
        } else {
          setPairs(PAIRS);
        }
      })
      .catch(() => setPairs(PAIRS))
      .finally(() => setLoading(false));
  }, []);

  const filteredPairs = useMemo(() => {
    switch (activeTab) {
      case 'Free':
        return pairs.filter((p) => p.status === 'free');
      case 'Region':
        return pairs.filter((p) => p.status === 'region');
      case 'Paid':
        return pairs.filter((p) => p.status === 'paid');
      default:
        return pairs;
    }
  }, [activeTab, pairs]);

  const tabs = useMemo(
    () => [
      { key: 'All', label: 'All tools', count: pairs.length, dot: '' },
      { key: 'Free', label: 'Free', count: pairs.filter((p) => p.status === 'free').length, dot: 'bg-green-500' },
      { key: 'Region', label: 'Region-based', count: pairs.filter((p) => p.status === 'region').length, dot: 'bg-gray-400' },
      { key: 'Paid', label: 'Paid', count: pairs.filter((p) => p.status === 'paid').length, dot: 'bg-gray-400' },
    ],
    [pairs],
  );

  return (
    <section id="pairs" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Migration pairs</p>
          <h2 className="mt-2 text-3xl font-bold text-text-primary tracking-tight">
            Select your migration path
          </h2>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 border',
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-text-secondary border-border hover:border-border-medium hover:text-text-primary',
                )}
              >
                {tab.dot && !active && <span className={cn('w-1.5 h-1.5 rounded-full', tab.dot)} />}
                {tab.label}
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-semibold',
                    active ? 'bg-white/20 text-white' : 'bg-bg-light text-text-tertiary',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <PairCardSkeleton key={i} />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPairs.map((pair, i) => (
                <PairCard key={`${pair.src}-${pair.dst}-${i}`} pair={pair} index={i} />
              ))}
            </div>
            {filteredPairs.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                No migration pairs found for this filter.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
