import React from 'react';
import { cn, formatNumber, formatPercent } from '@/utils/format';
import { ADMIN_TABLE_DATA } from '@/constants/admin';

export const MigrationTable: React.FC = () => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-light">
      <h3 className="text-sm font-bold text-text-primary">Pair-wise Migration Breakdown</h3>
      <span className="text-xs text-text-tertiary">All 9 pairs · Live data</span>
    </div>

    {/* Scrollable table */}
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-light">
            {['Migration Pair', 'Total', 'Completed', 'In Progress', 'Failed', 'Success Rate', 'Status', 'Avg. Time'].map((h) => (
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
          {ADMIN_TABLE_DATA.map(({ pair, total, completed, inProgress, failed, successRate, avgTime }, i) => {
            const rateColor =
              successRate >= 99 ? 'text-green-600' :
              successRate >= 98 ? 'text-lime-600' : 'text-amber-600';

            return (
              <tr
                key={`${pair.src}-${pair.dst}`}
                className={cn(
                  'border-b border-border last:border-0 transition-colors hover:bg-bg-light',
                  i % 2 === 0 ? 'bg-white' : 'bg-bg/40'
                )}
              >
                {/* Pair */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-5 h-5 rounded text-[9px] font-extrabold text-white flex items-center justify-center"
                        style={{ backgroundColor: pair.srcColor }}
                      >
                        {pair.srcAbbr}
                      </div>
                      <span className="text-text-tertiary text-[10px]">→</span>
                      <div
                        className="w-5 h-5 rounded text-[9px] font-extrabold text-white flex items-center justify-center"
                        style={{ backgroundColor: pair.dstColor }}
                      >
                        {pair.dstAbbr}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
                      {pair.src} → {pair.dst}
                    </span>
                  </div>
                </td>

                {/* Numbers */}
                <td className="px-4 py-3 text-xs font-mono text-text-primary">{formatNumber(total)}</td>
                <td className="px-4 py-3 text-xs font-mono text-green-600 font-semibold">{formatNumber(completed)}</td>
                <td className="px-4 py-3 text-xs font-mono text-blue-600 font-semibold">{inProgress}</td>
                <td className="px-4 py-3 text-xs font-mono text-red-500 font-semibold">{failed}</td>

                {/* Success Rate bar */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', rateColor.replace('text-', 'bg-'))}
                        style={{ width: `${successRate}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold font-mono', rateColor)}>
                      {formatPercent(successRate)}
                    </span>
                  </div>
                </td>

                {/* Status dot */}
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        inProgress > 0 ? 'bg-green-500 animate-pulse' : 'bg-text-tertiary'
                      )}
                    />
                    <span className="text-xs text-text-secondary">
                      {inProgress > 0 ? 'Active' : 'Idle'}
                    </span>
                  </span>
                </td>

                {/* Avg time */}
                <td className="px-4 py-3 text-xs text-text-secondary">{avgTime}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
