import React from 'react';
import { formatNumber } from '@/utils/format';
import { PAIRS } from '@/constants/pairs';
import { ADMIN_DATA } from '@/constants/admin';

// ─── Bar Chart ────────────────────────────────────────────────────────────────

export const BarChart: React.FC = () => {
  const max = Math.max(...ADMIN_DATA.map((d) => d.completed));

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
      <div className="px-5 py-4 border-b border-border bg-bg-light">
        <h3 className="text-sm font-bold text-text-primary">Migrations by Pair</h3>
        <p className="text-xs text-text-secondary mt-0.5">Total completed migrations per pair</p>
      </div>

      <div className="p-5 space-y-3">
        {PAIRS.map((pair, i) => {
          const value = ADMIN_DATA[i]?.completed ?? 0;
          const pct   = (value / max) * 100;

          return (
            <div key={`${pair.src}-${pair.dst}`} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-20 text-right text-xs text-text-secondary font-medium whitespace-nowrap shrink-0">
                {pair.src}→{pair.dst}
              </div>

              {/* Bar track */}
              <div className="flex-1 h-5 bg-bg-lighter rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2 transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: pair.srcColor }}
                >
                  <span className="text-[10px] font-bold text-white/90 font-mono leading-none whitespace-nowrap">
                    {formatNumber(value)}
                  </span>
                </div>
              </div>

              {/* Rate */}
              <span className="w-12 text-right text-xs font-semibold font-mono text-text-secondary shrink-0">
                {ADMIN_DATA[i]?.successRate}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const OUTCOMES = [
  { label: 'Completed',   value: 13726, color: '#16a34a' },
  { label: 'In Progress', value: 81,    color: '#2563eb' },
  { label: 'Pending',     value: 57,    color: '#b45309' },
  { label: 'Failed',      value: 83,    color: '#dc2626' },
];

const TOTAL = OUTCOMES.reduce((s, o) => s + o.value, 0);
const SUCCESS_RATE = ((OUTCOMES[0].value / TOTAL) * 100).toFixed(1);

// Build SVG arc segments
function buildArcs(outcomes: typeof OUTCOMES, r = 52, cx = 69, cy = 69, strokeWidth = 18) {
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return outcomes.map((o) => {
    const dash = (o.value / TOTAL) * circumference;
    const gap  = circumference - dash;
    const arc = (
      <circle
        key={o.label}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={o.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset + circumference / 4}
        strokeLinecap="round"
      />
    );
    offset += dash;
    return arc;
  });
}

export const DonutChart: React.FC = () => (
  <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
    <div className="px-5 py-4 border-b border-border bg-bg-light">
      <h3 className="text-sm font-bold text-text-primary">Overall Migration Outcomes</h3>
      <p className="text-xs text-text-secondary mt-0.5">Aggregate breakdown across all pairs</p>
    </div>

    <div className="p-5 flex items-center justify-center gap-8 flex-wrap">
      {/* SVG donut */}
      <svg width="138" height="138" viewBox="0 0 138 138">
        {/* Background ring */}
        <circle cx="69" cy="69" r="52" fill="none" stroke="#e8edf7" strokeWidth="18" />
        {buildArcs(OUTCOMES)}
        {/* Center text */}
        <text x="69" y="64" textAnchor="middle" fontSize="19" fontWeight="700" fill="#111827" fontFamily="IBM Plex Sans, sans-serif">
          {SUCCESS_RATE}%
        </text>
        <text x="69" y="79" textAnchor="middle" fontSize="9.5" fill="#4b5568" fontFamily="IBM Plex Sans, sans-serif">
          success rate
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-3">
        {OUTCOMES.map((o) => (
          <div key={o.label} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
            <span className="text-xs text-text-secondary">{o.label}</span>
            <span className="text-sm font-bold text-text-primary ml-auto pl-4 font-mono">
              {formatNumber(o.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);
