import React from 'react';
import { formatNumber } from '@/utils/format';
import { PLATFORM_COLORS } from '@/constants/logos';
import { normalizePlatform } from '@/utils/platformMap';
import type { AnalyticsOutcomes } from '@/types/api';

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarChartProps {
  outcomes: AnalyticsOutcomes | null;
  loading?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({ outcomes, loading }) => {
  const rows = outcomes?.byPair ?? [];
  const max  = Math.max(...rows.map((r) => r.completed), 1);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border bg-bg-light">
        <h3 className="text-sm font-bold text-text-primary">Migrations by Pair</h3>
        <p className="text-xs text-text-secondary mt-0.5">Total completed migrations per pair</p>
      </div>

      <div className="p-5 space-y-3">
        {loading || rows.length === 0 ? (
          Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-20 h-3 bg-bg-lighter rounded" />
              <div className="flex-1 h-5 bg-bg-lighter rounded" />
              <div className="w-10 h-3 bg-bg-lighter rounded" />
            </div>
          ))
        ) : (
          rows.map((row) => {
            const src   = normalizePlatform(row.source);
            const color = PLATFORM_COLORS[src] ?? '#64748b';
            const pct   = (row.completed / max) * 100;

            return (
              <div key={row.id} className="flex items-center gap-3">
                <div className="w-24 text-right text-xs text-text-secondary font-medium whitespace-nowrap shrink-0 truncate">
                  {row.displayName}
                </div>
                <div className="flex-1 h-5 bg-bg-lighter rounded overflow-hidden">
                  <div
                    className="h-full rounded flex items-center pl-2 transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  >
                    <span className="text-[10px] font-bold text-white/90 font-mono leading-none whitespace-nowrap">
                      {formatNumber(row.completed)}
                    </span>
                  </div>
                </div>
                <span className="w-12 text-right text-xs font-semibold font-mono text-text-secondary shrink-0">
                  {row.successRate}%
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutChartProps {
  outcomes: AnalyticsOutcomes | null;
  loading?: boolean;
}

// Status colours stay semantic (green / red); "in progress" follows the brand accent and "pending" is neutral so
// the two never read as the same orange. CSS variables keep the chart on the theme.
const COLORS = {
  completed:  '#16a34a',
  inProgress: 'rgb(var(--blue-600))',
  pending:    'rgb(var(--text-tertiary))',
  failed:     '#dc2626',
};

function buildArcs(
  slices: Array<{ value: number; color: string }>,
  total: number,
  r = 52, cx = 69, cy = 69, sw = 18,
) {
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return slices.map(({ value, color }, i) => {
    const dash = (value / total) * circ;
    const gap  = circ - dash;
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        style={{ stroke: color }}
        strokeWidth={sw}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset + circ / 4}
        strokeLinecap="round"
      />
    );
    offset += dash;
    return el;
  });
}

export const DonutChart: React.FC<DonutChartProps> = ({ outcomes, loading }) => {
  const data = outcomes
    ? [
        { label: 'Completed',   value: outcomes.completed,  color: COLORS.completed },
        { label: 'In Progress', value: outcomes.inProgress, color: COLORS.inProgress },
        { label: 'Pending',     value: outcomes.pending,    color: COLORS.pending },
        { label: 'Failed',      value: outcomes.failed,     color: COLORS.failed },
      ]
    : [];

  const total       = outcomes?.total ?? 1;
  const successRate = outcomes?.successRate.toFixed(1) ?? '—';

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border bg-bg-light">
        <h3 className="text-sm font-bold text-text-primary">Overall Migration Outcomes</h3>
        <p className="text-xs text-text-secondary mt-0.5">Aggregate breakdown across all pairs</p>
      </div>

      <div className="p-5 flex items-center justify-center gap-8 flex-wrap">
        {loading || !outcomes ? (
          <div className="w-[138px] h-[138px] rounded-full border-[18px] border-bg-lighter animate-pulse" />
        ) : (
          <svg width="138" height="138" viewBox="0 0 138 138">
            <circle cx="69" cy="69" r="52" fill="none" style={{ stroke: 'rgb(var(--bg-lighter))' }} strokeWidth="18" />
            {buildArcs(data, total)}
            <text x="69" y="64" textAnchor="middle" fontSize="19" fontWeight="700" style={{ fill: 'rgb(var(--text-primary))' }} fontFamily="IBM Plex Sans, sans-serif">
              {successRate}%
            </text>
            <text x="69" y="79" textAnchor="middle" fontSize="9.5" style={{ fill: 'rgb(var(--text-secondary))' }} fontFamily="IBM Plex Sans, sans-serif">
              success rate
            </text>
          </svg>
        )}

        <div className="flex flex-col gap-3">
          {(loading || !outcomes ? [
            { label: 'Completed',   color: COLORS.completed },
            { label: 'In Progress', color: COLORS.inProgress },
            { label: 'Pending',     color: COLORS.pending },
            { label: 'Failed',      color: COLORS.failed },
          ] : data).map((o) => (
            <div key={o.label} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
              <span className="text-xs text-text-secondary">{o.label}</span>
              <span className="text-sm font-bold text-text-primary ml-auto pl-4 font-mono">
                {loading || !outcomes ? (
                  <span className="inline-block w-10 h-3 bg-bg-lighter rounded animate-pulse" />
                ) : (
                  formatNumber((o as typeof data[0]).value)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
