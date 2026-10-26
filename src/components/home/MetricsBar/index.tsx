import React from 'react';
import { motion } from 'framer-motion';
import { TRUST_METRICS } from '@/content/trustMetrics';
import { useCatalogueCounts } from '@/hooks/useAvailablePairs';

interface Tile {
  value: string | null; // null = still loading
  label: string;
  icon: string;
}

export const MetricsBar: React.FC = () => {
  const counts = useCatalogueCounts();

  const tiles: Tile[] = [
    ...(TRUST_METRICS.migrationsCompleted
      ? [{ value: TRUST_METRICS.migrationsCompleted, label: 'Migrations completed', icon: '🔄' }]
      : []),
    ...(TRUST_METRICS.dataAccuracy ? [{ value: TRUST_METRICS.dataAccuracy, label: 'Data accuracy rate', icon: '✅' }] : []),
    // The pair count comes from the catalogue; hidden if the catalogue cannot be loaded.
    ...(counts === undefined ? [] : [{ value: counts ? String(counts.pairs) : null, label: 'Platform pairs', icon: '🔗' }]),
    { value: '24/7', label: 'Expert support', icon: '🛡️' },
  ];

  return (
    <section className="py-12 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
          {tiles.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center min-w-[8rem]"
            >
              <div className="text-3xl mb-1">{metric.icon}</div>
              <div className="text-2xl sm:text-3xl font-bold text-text-primary font-mono">
                {metric.value ?? <span aria-hidden className="inline-block h-7 w-10 animate-pulse rounded bg-bg-lighter align-middle" />}
              </div>
              <div className="text-sm text-text-tertiary mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
