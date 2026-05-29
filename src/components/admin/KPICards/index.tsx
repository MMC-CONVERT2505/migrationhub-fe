import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { KPI_CARDS } from '@/constants/admin';

export const KPICards: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {KPI_CARDS.map((kpi, i) => (
      <motion.div
        key={kpi.label}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06, duration: 0.3 }}
        className="bg-white border border-border rounded-xl p-5 shadow-card"
      >
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
            {kpi.label}
          </p>
          <span className="text-lg">{kpi.icon}</span>
        </div>
        <p className="text-3xl font-bold text-text-primary tracking-tight leading-none mb-2">
          {kpi.value}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            kpi.changePositive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          )}
        >
          {kpi.changePositive ? '↑' : '↓'} {kpi.change}
        </span>
      </motion.div>
    ))}
  </div>
);
