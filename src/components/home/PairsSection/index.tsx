import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiPairToUiPair, extractList } from '@/utils/platformMap';
import { getAvailablePairs } from '@/api/availablePairs';
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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // The server is the only source of pairs, plans and prices. A failed load is shown as a failure with a
  // retry — never papered over with a built-in list, whose links and (missing) plans would be wrong.
  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    getAvailablePairs({ force: attempt > 0 })
      .then((res) => {
        if (live) setPairs(extractList<MigrationPairEntity>(res).map(apiPairToUiPair));
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  return (
    <section id="pairs" className="pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Migration pairs</p>
          <h2 className="mt-2 text-3xl font-bold text-text-primary tracking-tight">
            Select your migration path
          </h2>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <PairCardSkeleton key={i} />)}
          </div>
        ) : failed ? (
          <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-sm font-semibold text-text-primary">We couldn&rsquo;t load the migration pairs</p>
            <p className="mt-1 text-sm text-text-secondary">Please check your connection and try again.</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pairs.map((pair, i) => (
                <PairCard key={`${pair.src}-${pair.dst}-${i}`} pair={pair} index={i} />
              ))}
            </div>
            {pairs.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                No migration pairs are available right now.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
