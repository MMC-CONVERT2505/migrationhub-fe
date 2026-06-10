import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KPICards } from '@/components/admin/KPICards';
import { MigrationTable } from '@/components/admin/MigrationTable';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BarChart, DonutChart } from '@/components/admin/Charts';
import { analyticsService } from '@/api/admin';
import type { ActivityItem, AnalyticsOutcomes, AnalyticsPair, AnalyticsSummary } from '@/types/api';

const AdminDashboard: React.FC = () => {
  const [summary,  setSummary]  = useState<AnalyticsSummary | null>(null);
  const [pairs,    setPairs]    = useState<AnalyticsPair[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [outcomes, setOutcomes] = useState<AnalyticsOutcomes | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummaryPairsOutcomes = async () => {
    const [summaryRes, pairsRes, outcomesRes] = await Promise.all([
      analyticsService.getSummary(),
      analyticsService.getPairs(),
      analyticsService.getOutcomes(),
    ]);
    setSummary(summaryRes);
    setPairs(pairsRes.pairs);
    setOutcomes(outcomesRes);
    setLastUpdated(new Date());
  };

  const fetchActivity = async () => {
    const res = await analyticsService.getActivity(20);
    setActivity(res.items);
  };

  useEffect(() => {
    Promise.all([fetchSummaryPairsOutcomes(), fetchActivity()])
      .catch(() => {/* errors surfaced per-component via empty state */})
      .finally(() => setLoading(false));

    // Activity refreshes every 10 s; KPI/pairs/outcomes every 30 s
    const activityTimer  = setInterval(() => fetchActivity().catch(() => {}), 10_000);
    const summaryTimer   = setInterval(() => fetchSummaryPairsOutcomes().catch(() => {}), 30_000);

    return () => {
      clearInterval(activityTimer);
      clearInterval(summaryTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Migration Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Real-time overview of all migration activity
            {lastUpdated && (
              <span className="text-text-tertiary">
                {' · '}Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        {/* Refresh dot */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          Live
        </div>
      </div>

      <KPICards data={summary} loading={loading} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 mb-5">
        <MigrationTable pairs={pairs} loading={loading} />
        <ActivityFeed items={activity} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarChart outcomes={outcomes} loading={loading} />
        <DonutChart outcomes={outcomes} loading={loading} />
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
