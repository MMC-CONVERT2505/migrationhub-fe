import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BarChart, DonutChart } from '@/components/admin/Charts';
import { analyticsService } from '@/api/admin';
import type { ActivityItem, AnalyticsOutcomes, AnalyticsSummary } from '@/types/api';

// ─── Static audit log entries ─────────────────────────────────────────────────
const AUDIT_LOGS = [
  { id: 1,  action: 'Plan Created',           actor: 'admin@mmcconvert.com', target: 'Starter Plan',          level: 'info',    ts: '2026-05-30 09:14:02' },
  { id: 2,  action: 'Migration Pair Updated',  actor: 'admin@mmcconvert.com', target: 'Xero → MYOB',          level: 'info',    ts: '2026-05-30 09:10:45' },
  { id: 3,  action: 'User Banned',             actor: 'admin@mmcconvert.com', target: 'user#142',             level: 'warning', ts: '2026-05-30 08:55:11' },
  { id: 4,  action: 'Migration Failed',        actor: 'system',               target: 'job#8821 (Xero→MYOB)', level: 'error',   ts: '2026-05-30 08:42:30' },
  { id: 5,  action: 'Plan Deleted',            actor: 'admin@mmcconvert.com', target: 'Legacy Pro Plan',       level: 'warning', ts: '2026-05-30 08:30:00' },
  { id: 6,  action: 'Migration Pair Created',  actor: 'admin@mmcconvert.com', target: 'QBO → Xero',           level: 'info',    ts: '2026-05-29 17:05:22' },
  { id: 7,  action: 'Webhook Secret Rotated',  actor: 'admin@mmcconvert.com', target: 'Pair#3 (MYOB→QBO)',    level: 'info',    ts: '2026-05-29 16:48:59' },
  { id: 8,  action: 'Login',                   actor: 'admin@mmcconvert.com', target: '—',                    level: 'success', ts: '2026-05-29 09:01:13' },
  { id: 9,  action: 'Password Changed',        actor: 'admin@mmcconvert.com', target: '—',                    level: 'info',    ts: '2026-05-28 14:22:07' },
  { id: 10, action: 'Migration Completed',     actor: 'system',               target: 'job#8814 (Xero→MYOB)', level: 'success', ts: '2026-05-28 11:10:04' },
];

const LEVEL_STYLES: Record<string, string> = {
  success: 'bg-green-50 text-green-700',
  info:    'bg-blue-50 text-blue-700',
  warning: 'bg-yellow-50 text-yellow-700',
  error:   'bg-red-50 text-red-700',
};

type LevelFilter = 'all' | 'info' | 'success' | 'warning' | 'error';

const AuditPage: React.FC = () => {
  const [filter, setFilter]     = useState<LevelFilter>('all');
  const [summary, setSummary]   = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [outcomes, setOutcomes] = useState<AnalyticsOutcomes | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getActivity(20),
      analyticsService.getOutcomes(),
    ])
      .then(([s, a, o]) => {
        setSummary(s);
        setActivity(a.items);
        setOutcomes(o);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const timer = setInterval(() =>
      analyticsService.getActivity(20).then((a) => setActivity(a.items)).catch(() => {}),
    10_000);
    return () => clearInterval(timer);
  }, []);

  const summaryStats = summary
    ? [
        { label: 'Total Migrations',  value: summary.totalMigrations.toLocaleString(),   change: summary.totalDelta.label,       positive: summary.totalDelta.positive },
        { label: 'Success Rate',       value: `${summary.successRate}%`,                  change: summary.successRateDelta.label,  positive: summary.successRateDelta.positive },
        { label: 'Active Now',         value: String(summary.activeNow),                  change: summary.activeNowDelta.label,    positive: summary.activeNowDelta.positive },
        { label: 'Avg Duration',       value: `${summary.avgDurationMinutes} min`,         change: summary.avgDurationDelta.label,  positive: summary.avgDurationDelta.positive },
      ]
    : Array(4).fill(null);

  const filtered = filter === 'all' ? AUDIT_LOGS : AUDIT_LOGS.filter((l) => l.level === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Audit & Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Admin actions, system events, and migration activity across the platform
        </p>
      </div>

      {/* Summary stats from API */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-border rounded-xl p-4 shadow-card"
          >
            {loading || !s ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-bg-lighter rounded w-3/4" />
                <div className="h-7 bg-bg-lighter rounded w-1/2" />
                <div className="h-4 bg-bg-lighter rounded w-2/3" />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">{s.label}</p>
                <p className="text-3xl font-bold text-text-primary tracking-tight leading-none mb-2">{s.value}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${s.positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {s.positive ? '↑' : '↓'} {s.change}
                </span>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <BarChart outcomes={outcomes} loading={loading} />
        <DonutChart outcomes={outcomes} loading={loading} />
      </div>

      {/* Audit log table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-light flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Audit Log</h3>
            <p className="text-xs text-text-secondary mt-0.5">Recent admin and system events</p>
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'success', 'info', 'warning', 'error'] as LevelFilter[]).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-3 py-1 text-xs font-semibold rounded-full capitalize transition-colors ${
                  filter === lvl
                    ? 'bg-blue-600 text-white'
                    : 'bg-bg-light text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Action', 'Actor', 'Target', 'Level', 'Timestamp'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-text-tertiary">
                    No events match this filter
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{log.action}</td>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{log.actor}</td>
                    <td className="px-4 py-3 text-text-secondary">{log.target}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${LEVEL_STYLES[log.level]}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-tertiary">{log.ts}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live activity feed from API */}
      <ActivityFeed items={activity} loading={loading} />
    </motion.div>
  );
};

export default AuditPage;
