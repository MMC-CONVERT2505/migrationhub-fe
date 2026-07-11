import React from 'react';
import type { ReportDetail, ReportOrderRow } from '@/api/reports';
import { normalizePlatform } from '@/utils/platformMap';
import { PLATFORM_ABBR, PLATFORM_COLORS, platformLogo } from '@/constants/logos';
import { PlatformMark } from '@/components/common/PlatformMark';

/** Logo (public folder → DB) + abbr/colour fallback for a platform key, e.g. "qbo". */
function brand(platformKey: string, dbLogo?: string | null) {
  const name = normalizePlatform(platformKey);
  return {
    logo: platformLogo(platformKey) ?? (dbLogo || null),
    name,
    abbr: PLATFORM_ABBR[name] ?? name.slice(0, 2).toUpperCase(),
    color: PLATFORM_COLORS[name] ?? '#64748b',
  };
}

// Date-only fields are stored at UTC midnight — format in UTC to avoid a
// local-timezone off-by-one day shift.
const fmtDay = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    : '';

const fmtRunDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

const days = (n: number | null) => (n != null ? `${n}d` : '');

// Inclusive whole-day span between two UTC-midnight date-only fields (e.g. 22 Jun
// → 1 Jul = 10 days), matching how the source report counts turnaround.
function inclusiveDays(fromIso: string | null, toIso: string | null): number | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.round((to - from) / 86_400_000) + 1;
}

// "Actual" = permission-to-access → completion (real turnaround), derived here
// since the API stores only the tool metric. "Tool" = the migration tool's own
// reported processing days (Allocate → completion).
const actualDays = (o: ReportOrderRow): number | null =>
  inclusiveDays(o.ptaDate, o.completedAt);
const toolDays = (o: ReportOrderRow): number | null => o.processingDays;

const finite = (vals: (number | null)[]): number[] =>
  vals.filter((v): v is number => v != null);
const mean = (vals: (number | null)[]): number | null => {
  const ns = finite(vals);
  return ns.length ? Math.round((ns.reduce((a, b) => a + b, 0) / ns.length) * 10) / 10 : null;
};
const minOf = (vals: (number | null)[]): number | null => {
  const ns = finite(vals);
  return ns.length ? Math.min(...ns) : null;
};
const maxOf = (vals: (number | null)[]): number | null => {
  const ns = finite(vals);
  return ns.length ? Math.max(...ns) : null;
};

const ORDER_COLUMNS = ['Order Number', 'File Name', 'PTA', 'Allocate', 'Completed', 'Actual', 'Tool'];

function orderRowValues(o: ReportOrderRow): string[] {
  return [
    o.orderNumber,
    o.fileName ?? '',
    fmtDay(o.ptaDate),
    fmtDay(o.startedAt),
    fmtDay(o.completedAt),
    days(actualDays(o)),
    days(toolDays(o)),
  ];
}

/**
 * Dark monospace panel that reproduces the source Slack report layout:
 * header stats, Country Summary, and Order Details grouped by country.
 */
export const ReportView: React.FC<{
  report: ReportDetail;
  sourceLogo?: string | null;
  destinationLogo?: string | null;
}> = ({ report, sourceLogo, destinationLogo }) => {
  const src = brand(report.source, sourceLogo);
  const dst = brand(report.destination, destinationLogo);

  // Per-country orders, to derive the Actual (PTA→completion) stats the API
  // doesn't store. Overall Actual is the mean across every order.
  const ordersByCode = new Map<string, ReportOrderRow[]>(
    report.groups.map((g) => [g.code, g.orders] as [string, ReportOrderRow[]]),
  );
  const ordersByName = new Map<string, ReportOrderRow[]>(
    report.groups.map((g) => [g.name, g.orders] as [string, ReportOrderRow[]]),
  );
  const overallActual = mean(
    report.groups.flatMap((g) => g.orders).map(actualDays),
  );
  return (
  <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 overflow-hidden">
    {/* Header */}
    <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-4">
      <div className="flex items-center gap-2 flex-shrink-0">
        <PlatformMark logo={src.logo} abbr={src.abbr} color={src.color} name={src.name} className="w-10 h-10 rounded-lg" textClassName="text-sm" />
        <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <PlatformMark logo={dst.logo} abbr={dst.abbr} color={dst.color} name={dst.name} className="w-10 h-10 rounded-lg" textClassName="text-sm" />
      </div>
      <div className="min-w-0">
      <h2 className="text-lg font-bold text-white font-mono tracking-tight">{report.title}</h2>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-sm font-mono text-slate-300">
        <span><span className="text-slate-400">Run Date:</span> {fmtRunDate(report.runDate)}</span>
        <span><span className="text-slate-400">Total Orders:</span> {report.totalOrders}</span>
        {overallActual != null && (
          <span><span className="text-slate-400">Overall Avg (Actual):</span> {overallActual} days</span>
        )}
        {report.averageDays != null && (
          <span><span className="text-slate-400">Overall Avg (Tool):</span> {report.averageDays} days</span>
        )}
      </p>
      </div>
    </div>

    {/* Country summary */}
    <Section title="Country Summary">
      <MonoTable
        headers={['Country', 'Orders', 'Avg(A)', 'Avg(T)', 'Min', 'Max']}
        rows={report.countries.map((c) => {
          const actuals = (
            ordersByCode.get(c.code) ?? ordersByName.get(c.name) ?? []
          ).map(actualDays);
          return {
            flagged: c.flagged,
            values: [
              c.name,
              String(c.orders),
              days(mean(actuals)), // Actual avg — derived from PTA→completion
              days(c.averageDays), // Tool avg — the stored tool metric
              days(minOf(actuals)), // Min/Max reflect the Actual distribution
              days(maxOf(actuals)),
            ],
          };
        })}
      />
    </Section>

    {/* Order details */}
    <Section title="Order Details">
      {report.groups.length === 0 ? (
        <p className="text-sm text-slate-500 font-mono">No order rows.</p>
      ) : (
        <div className="space-y-6">
          {report.groups.map((group) => (
            <div key={group.code}>
              <p className="text-sm font-bold text-white font-mono mb-2">[ {group.name.toUpperCase()} ]</p>
              <MonoTable
                headers={ORDER_COLUMNS}
                rows={group.orders.map((o) => ({ flagged: o.flagged, values: orderRowValues(o) }))}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="px-6 py-5 border-b border-slate-800 last:border-b-0">
    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
    {children}
  </div>
);

interface MonoRow {
  flagged: boolean;
  values: string[];
}

const MonoTable: React.FC<{ headers: string[]; rows: MonoRow[] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto rounded-lg bg-slate-950/40 border border-slate-800">
    <table className="w-full text-xs font-mono border-collapse">
      <thead>
        <tr className="text-slate-400 border-b border-dashed border-slate-700">
          <th className="w-6" aria-label="flag" />
          {headers.map((h, i) => (
            <th key={i} className="text-left font-normal px-3 py-2 whitespace-nowrap">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length + 1} className="px-3 py-3 text-center text-slate-500">—</td>
          </tr>
        ) : (
          rows.map((r, ri) => (
            <tr key={ri} className="text-slate-200 hover:bg-slate-800/40">
              <td className="pl-3 align-middle">
                {r.flagged && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />}
              </td>
              {r.values.map((v, ci) => (
                <td key={ci} className="px-3 py-1 whitespace-nowrap">{v}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default ReportView;
