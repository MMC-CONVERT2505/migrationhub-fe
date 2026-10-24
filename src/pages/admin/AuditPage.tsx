import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { BarChart, DonutChart } from '@/components/admin/Charts';
import { analyticsService, activitiesService } from '@/api/admin';
import { principalLabel, principalSubLabel } from '@/utils/format';
import { Pagination } from '@/components/admin/Pagination';
import { clampSkip } from '@/utils/pagination';
import type {
  ActivityItem,
  AnalyticsOutcomes,
  AnalyticsSummary,
  AuditLogItem,
  AuditLogLevel,
  PrincipalType,
} from '@/types/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'plan.created':                   'Plan Created',
  'plan.updated':                   'Plan Updated',
  'plan.deleted':                   'Plan Deleted',
  'migration_pair.created':         'Migration Pair Created',
  'migration_pair.updated':         'Migration Pair Updated',
  'migration_pair.deleted':         'Migration Pair Deleted',
  'migration_pair.secret_rotated':  'Webhook Secret Rotated',
  'admin.profile_updated':          'Profile Updated',
  'admin.password_changed':         'Password Changed',
  'user.ban':                       'User Blocked',
  'user.unban':                     'User Unblocked',
};

const LEVEL_STYLES: Record<AuditLogLevel, string> = {
  Success: 'bg-green-50 text-green-700',
  Info:    'bg-blue-50 text-blue-700',
  Warning: 'bg-yellow-50 text-yellow-700',
  Error:   'bg-red-50 text-red-700',
};

const ACTOR_TYPE_STYLES: Record<PrincipalType, string> = {
  admin:  'bg-purple-50 text-purple-700',
  user:   'bg-blue-50 text-blue-700',
  system: 'bg-gray-100 text-gray-600',
};

type LevelFilter = 'all' | AuditLogLevel;
const TABS: LevelFilter[] = ['all', 'Success', 'Info', 'Warning', 'Error'];
const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

const AuditPage: React.FC = () => {
  const [filter, setFilter]     = useState<LevelFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [skip, setSkip]         = useState(0);

  const [auditRows, setAuditRows]   = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(true);

  const [summary, setSummary]   = useState<AnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [outcomes, setOutcomes] = useState<AnalyticsOutcomes | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── Load audit log ───────────────────────────────────────────────────────────
  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await activitiesService.list({
        level: filter === 'all' ? undefined : filter,
        from:  fromDate ? `${fromDate}T00:00:00Z` : undefined,
        to:    toDate   ? `${toDate}T23:59:59Z`   : undefined,
        skip,
        take: PAGE_SIZE,
      });
      const rows = (res as any)?.data ?? res;
      setAuditRows(Array.isArray(rows) ? rows : rows?.data ?? []);
      setAuditTotal((res as any)?.total ?? 0);
      // The list can shrink under us: never sit on a page past the end.
      const safeSkip = clampSkip(skip, ((res as any)?.total ?? 0), PAGE_SIZE);
      if (safeSkip !== skip) setSkip(safeSkip);
    } catch {
      setAuditRows([]);
    } finally {
      setAuditLoading(false);
    }
  }, [filter, fromDate, toDate, skip]);

  useEffect(() => { loadAudit(); }, [loadAudit]);

  // Reset to page 0 when filters change
  useEffect(() => { setSkip(0); }, [filter, fromDate, toDate]);

  // ── Load stats + activity feed ───────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      analyticsService.getSummary(),
      analyticsService.getActivity(20),
      analyticsService.getOutcomes(),
    ])
      .then(([s, a, o]) => { setSummary(s); setActivity(a.items); setOutcomes(o); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));

    const timer = setInterval(() =>
      analyticsService.getActivity(20).then((a) => setActivity(a.items)).catch(() => {}),
    10_000);
    return () => clearInterval(timer);
  }, []);

  // ── Summary cards ────────────────────────────────────────────────────────────
  const summaryStats = summary
    ? [
        { label: 'Total Migrations', value: summary.totalMigrations.toLocaleString(),  change: summary.totalDelta.label,       positive: summary.totalDelta.positive },
        { label: 'Success Rate',      value: `${summary.successRate}%`,                 change: summary.successRateDelta.label,  positive: summary.successRateDelta.positive },
        { label: 'Active Now',        value: String(summary.activeNow),                 change: summary.activeNowDelta.label,    positive: summary.activeNowDelta.positive },
        { label: 'Avg Duration',      value: `${summary.avgDurationMinutes} min`,        change: summary.avgDurationDelta.label,  positive: summary.avgDurationDelta.positive },
      ]
    : Array(4).fill(null);


  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Audit & Logs</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Admin actions, system events, and migration activity across the platform
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-white border border-border rounded-xl p-4 shadow-card"
          >
            {statsLoading || !s ? (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <BarChart outcomes={outcomes} loading={statsLoading} />
        <DonutChart outcomes={outcomes} loading={statsLoading} />
      </div>

      {/* Audit log table */}
      <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden mb-5">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-border bg-bg-light flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Audit Log</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {auditTotal > 0 ? `${auditTotal} events` : 'Admin and system events'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date range */}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="From date"
            />
            <span className="text-xs text-text-secondary">–</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              title="To date"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-xs text-text-secondary hover:text-text-primary"
                title="Clear dates"
              >
                ✕
              </button>
            )}

            {/* Level tabs */}
            <div className="flex items-center gap-1 ml-1">
              {TABS.map((lvl) => (
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
        </div>

        {/* Table */}
        <div className="admin-scroll">
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
              {auditLoading ? (
                Array(6).fill(null).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(null).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-bg-lighter rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : auditRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-text-secondary">
                    No events match this filter
                  </td>
                </tr>
              ) : (
                auditRows.map((row) => (
                  <tr key={row.id} className="hover:bg-bg-light/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">
                      {ACTION_LABELS[row.action] ?? row.action}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-text-primary font-mono text-xs truncate max-w-[180px]" title={row.actor}>
                          {row.actor}
                        </span>
                        <span className={`self-start px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${ACTOR_TYPE_STYLES[row.actorType]}`}>
                          {row.actorType}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {row.owner ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-primary text-xs truncate" title={row.owner.email ?? row.owner.name}>
                            {principalLabel(row.owner)}
                          </span>
                          <span className="text-text-secondary text-[11px] truncate" title={row.message}>
                            {principalSubLabel(row.owner) ?? row.message}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-secondary text-xs truncate block" title={row.message}>
                          {row.message}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${LEVEL_STYLES[row.level]}`}>
                        {row.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary whitespace-nowrap">
                      {new Date(row.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination skip={skip} size={PAGE_SIZE} total={auditTotal} noun="entries" disabled={auditLoading} onSkipChange={setSkip} />
      </div>

      {/* Live activity feed */}
      <ActivityFeed items={activity} loading={statsLoading} />
    </motion.div>
  );
};

export default AuditPage;
