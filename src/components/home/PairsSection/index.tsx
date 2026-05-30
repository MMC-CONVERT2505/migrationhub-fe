import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import { PAIRS, PAIR_FILTER_TABS } from '@/constants/pairs';
import { migrationPairsService } from '@/api/migrationPairs';
import { PairCard } from './PairCard';
import type { Pair } from '@/types';

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
      .list({ isActive: true, limit: 50 } as any)
      .then((res) => {
        const items = extractList<any>(res);
        if (items.length > 0) {
          setPairs(
            items
              .filter((e: any) => !e.isMaintenance)
              .map(apiPairToUiPair)
          );
        } else {
          setPairs(PAIRS);
        }
      })
      .catch(() => setPairs(PAIRS))
      .finally(() => setLoading(false));
  }, []);

  const filteredPairs = useMemo(() => {
    if (activeTab === 'All') return pairs;
    if (activeTab === 'Free') return pairs.filter((p) => p.status === 'free' || p.status === 'region');
    return pairs.filter((p) => p.src === activeTab || p.dst === activeTab);
  }, [activeTab, pairs]);

  return (
    <section id="pairs" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-text-primary">Migration pairs</h2>
          <p className="mt-2 text-text-secondary">
            Select your source and destination platform to get started
          </p>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {PAIR_FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150',
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-text-secondary border border-border hover:border-border-medium hover:text-text-primary'
              )}
            >
              {tab}
            </button>
          ))}
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
