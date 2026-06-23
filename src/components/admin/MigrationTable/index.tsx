import React from 'react';
import { cn, formatNumber, formatPercent } from '@/utils/format';
import { PLATFORM_COLORS, PLATFORM_ABBR } from '@/constants/logos';
import { normalizePlatform } from '@/utils/platformMap';
import type { AnalyticsPair } from '@/types/api';

interface MigrationTableProps {
  pairs: AnalyticsPair[];
  loading?: boolean;
}

export const MigrationTable: React.FC<MigrationTableProps> = ({ pairs, loading }) => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-light">
      <h3 className="text-sm font-bold text-text-primary">Pair-wise Migration Breakdown</h3>
      <span className="text-xs text-text-tertiary">
        {loading ? 'Loading…' : `${pairs.length} pair${pairs.length !== 1 ? 's' : ''} · Live data`}
      </span>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-light">
            {['Migration Pair', 'Total', 'Completed', 'In Progress', 'Draft', 'Failed', 'Success Rate', 'Status', 'Avg. Time'].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-[10px] font-semibold text-text-tertiary uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array(5).fill(null).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array(9).fill(null).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3 bg-bg-lighter rounded animate-pulse w-16" />
                  </td>
                ))}
              </tr>
            ))
          ) : pairs.length === 0 ? (
            <tr>
              <td colSpan={9} className="text-center py-10 text-sm text-text-tertiary">
                No pair data available
              </td>
            </tr>
          ) : (
            pairs.map((p, i) => {
              const src     = normalizePlatform(p.source);
              const dst     = normalizePlatform(p.destination);
              const srcColor = PLATFORM_COLORS[src] ?? '#64748b';
              const dstColor = PLATFORM_COLORS[dst] ?? '#64748b';
              const srcAbbr  = PLATFORM_ABBR[src]   ?? src.slice(0, 2).toUpperCase();
              const dstAbbr  = PLATFORM_ABBR[dst]   ?? dst.slice(0, 2).toUpperCase();
              const rateColor =
                p.successRate >= 99 ? 'text-green-600' :
                p.successRate >= 98 ? 'text-lime-600' : 'text-amber-600';

              return (
                <tr
                  key={p.id}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors hover:bg-bg-light',
                    i % 2 === 0 ? 'bg-white' : 'bg-bg/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded text-[9px] font-extrabold text-white flex items-center justify-center" style={{ backgroundColor: srcColor }}>
                          {srcAbbr}
                        </div>
                        <span className="text-text-tertiary text-[10px]">→</span>
                        <div className="w-5 h-5 rounded text-[9px] font-extrabold text-white flex items-center justify-center" style={{ backgroundColor: dstColor }}>
                          {dstAbbr}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
                        {p.displayName}
                      </span>
                      {p.isMaintenance && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold">
                          Maint.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-text-primary">{formatNumber(p.total)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-green-600 font-semibold">{formatNumber(p.completed)}</td>
                  <td className="px-4 py-3 text-xs font-mono text-blue-600 font-semibold">{p.inProgress}</td>
                  <td className="px-4 py-3 text-xs font-mono text-text-tertiary font-semibold">{p.pending}</td>
                  <td className="px-4 py-3 text-xs font-mono text-red-500 font-semibold">{p.failed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', rateColor.replace('text-', 'bg-'))}
                          style={{ width: `${p.successRate}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-semibold font-mono', rateColor)}>
                        {formatPercent(p.successRate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', p.isActive && p.inProgress > 0 ? 'bg-green-500 animate-pulse' : 'bg-text-tertiary')} />
                      <span className="text-xs text-text-secondary">
                        {p.isActive && p.inProgress > 0 ? 'Active' : p.isMaintenance ? 'Maintenance' : 'Idle'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">{p.avgDurationMinutes} min</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
