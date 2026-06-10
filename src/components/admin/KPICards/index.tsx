import React from 'react';
import { motion } from 'framer-motion';
import { cn, formatNumber } from '@/utils/format';
import type { AnalyticsSummary } from '@/types/api';

const ICONS = ['🔄', '✅', '⚡', '⏱️'];

interface KPICardsProps {
  data: AnalyticsSummary | null;
  loading?: boolean;
}

export const KPICards: React.FC<KPICardsProps> = ({ data, loading }) => {
  const cards = data
    ? [
        {
          label: 'Total Migrations',
          value: formatNumber(data.totalMigrations),
          change: data.totalDelta.label,
          positive: data.totalDelta.positive,
        },
        {
          label: 'Success Rate',
          value: `${data.successRate}%`,
          change: data.successRateDelta.label,
          positive: data.successRateDelta.positive,
        },
        {
          label: 'Active Now',
          value: String(data.activeNow),
          change: data.activeNowDelta.label,
          positive: data.activeNowDelta.positive,
        },
        {
          label: 'Avg Duration',
          value: `${data.avgDurationMinutes} min`,
          change: data.avgDurationDelta.label,
          positive: data.avgDurationDelta.positive,
        },
      ]
    : Array(4).fill(null);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((kpi, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          className="bg-white border border-border rounded-xl p-5 shadow-card"
        >
          {loading || !kpi ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-bg-lighter rounded w-3/4" />
              <div className="h-8 bg-bg-lighter rounded w-1/2" />
              <div className="h-4 bg-bg-lighter rounded w-2/3" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {kpi.label}
                </p>
                <span className="text-lg">{ICONS[i]}</span>
              </div>
              <p className="text-3xl font-bold text-text-primary tracking-tight leading-none mb-2">
                {kpi.value}
              </p>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                  kpi.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                )}
              >
                {kpi.positive ? '↑' : '↓'} {kpi.change}
              </span>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
};
