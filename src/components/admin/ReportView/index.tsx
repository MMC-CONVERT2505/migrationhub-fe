import React from 'react';
import type { ReportDetail, ReportOrderRow } from '@/api/reports';

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

const ORDER_COLUMNS = ['Order Number', 'File Name', 'PTA', 'Start', 'Completed', 'Days'];

function orderRowValues(o: ReportOrderRow): string[] {
  return [
    o.orderNumber,
    o.fileName ?? '',
    fmtDay(o.ptaDate),
    fmtDay(o.startedAt),
    fmtDay(o.completedAt),
    days(o.processingDays),
  ];
}

/**
 * Dark monospace panel that reproduces the source Slack report layout:
 * header stats, Country Summary, and Order Details grouped by country.
 */
export const ReportView: React.FC<{ report: ReportDetail }> = ({ report }) => (
  <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 overflow-hidden">
    {/* Header */}
    <div className="px-6 py-5 border-b border-slate-800">
      <h2 className="text-lg font-bold text-white font-mono tracking-tight">{report.title}</h2>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-sm font-mono text-slate-300">
        <span><span className="text-slate-400">Run Date:</span> {fmtRunDate(report.runDate)}</span>
        <span><span className="text-slate-400">Total Orders:</span> {report.totalOrders}</span>
        {report.averageDays != null && (
          <span><span className="text-slate-400">Overall Avg:</span> {report.averageDays} days</span>
        )}
      </p>
    </div>

    {/* Country summary */}
    <Section title="Country Summary">
      <MonoTable
        headers={['Country', 'Orders', 'Avg', 'Min', 'Max']}
        rows={report.countries.map((c) => ({
          flagged: c.flagged,
          values: [c.name, String(c.orders), days(c.averageDays), days(c.minDays), days(c.maxDays)],
        }))}
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
