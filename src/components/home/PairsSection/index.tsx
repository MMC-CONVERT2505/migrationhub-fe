import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { PAIRS, PAIR_FILTER_TABS } from '@/constants/pairs';
import { PairCard } from './PairCard';

export const PairsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  const filteredPairs = useMemo(() => {
    if (activeTab === 'All') return PAIRS;
    if (activeTab === 'Free') return PAIRS.filter((p) => p.status === 'free' || p.status === 'region');
    return PAIRS.filter((p) => p.src === activeTab || p.dst === activeTab);
  }, [activeTab]);

  return (
    <section id="pairs" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-text-primary">
            Migration pairs
          </h2>
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

        {/* Pair cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.map((pair, i) => (
            <PairCard key={`${pair.src}-${pair.dst}`} pair={pair} index={i} />
          ))}
        </div>

        {filteredPairs.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            No migration pairs found for this filter.
          </div>
        )}
      </div>
    </section>
  );
};
