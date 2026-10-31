import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/format';
import type { DateRangeSelection } from '@/types';
import { formatDateRange, isoDay, parseIsoDay, rangeDays, validateDateRange } from '@/utils/dateRange';

interface CustomDateRangeProps {
  /** null = the normal period (plan years); an object = an exact From/To range (fields may still be empty). */
  value: DateRangeSelection | null;
  onChange: (range: DateRangeSelection | null) => void;
  /** Show every field's error now (the person pressed Continue with an incomplete range). */
  showErrors?: boolean;
}

const inputCls = (invalid: boolean) =>
  cn(
    'mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2',
    invalid ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-border focus:border-blue-500 focus:ring-blue-500/30',
  );

/**
 * Operation Team only: migrate the plan's usual period, or an exact From/To range for a client who needs one.
 * Errors appear once a field has been left (or on request), never while the person is still typing.
 */
export const CustomDateRange: React.FC<CustomDateRangeProps> = ({ value, onChange, showErrors = false }) => {
  const [touched, setTouched] = useState<{ from: boolean; to: boolean }>({ from: false, to: false });
  const custom = value !== null;
  const today = useMemo(() => new Date(), []);
  const max = isoDay(today);
  const errors = custom ? validateDateRange(value, today) : {};
  const show = (f: 'from' | 'to') => (showErrors || touched[f] ? errors[f] : undefined);
  const complete = custom && Object.keys(errors).length === 0;

  const setField = (f: 'from' | 'to', v: string) => onChange({ from: value?.from ?? '', to: value?.to ?? '', [f]: v });

  return (
    <fieldset className="mt-5 rounded-xl border border-border bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-text-primary">Migration period</legend>
      <p className="text-xs text-text-secondary">Operation Team: migrate the plan&rsquo;s usual period, or an exact date range.</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
        {([
          { id: 'period-years', label: 'Financial years (plan)', on: !custom, pick: () => onChange(null) },
          { id: 'period-custom', label: 'Custom date range', on: custom, pick: () => (custom ? undefined : onChange({ from: '', to: '' })) },
        ] as const).map((o) => (
          <label key={o.id} htmlFor={o.id} className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
            <input id={o.id} type="radio" name="migration-period" checked={o.on} onChange={o.pick} className="h-4 w-4 accent-blue-600" />
            {o.label}
          </label>
        ))}
      </div>

      {custom && (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {([
              { f: 'from', label: 'From date' },
              { f: 'to', label: 'To date' },
            ] as const).map(({ f, label }) => {
              const err = show(f);
              return (
                <div key={f}>
                  <label htmlFor={`range-${f}`} className="text-sm font-medium text-text-primary">{label}</label>
                  <input
                    id={`range-${f}`}
                    type="date"
                    value={value?.[f] ?? ''}
                    // Keep the picker consistent with the other field: To cannot start before From, nor From pass To.
                    min={f === 'to' && parseIsoDay(value?.from) ? value?.from : undefined}
                    max={f === 'from' && parseIsoDay(value?.to) && (value?.to ?? max) < max ? value?.to : max}
                    onChange={(e) => setField(f, e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, [f]: true }))}
                    aria-invalid={err ? true : undefined}
                    aria-describedby={err ? `range-${f}-error` : undefined}
                    className={inputCls(!!err)}
                  />
                  {err && (
                    <p id={`range-${f}-error`} role="alert" className="mt-1 text-xs text-red-600">{err}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-text-secondary" aria-live="polite">
            {complete && value
              ? `${formatDateRange(value)} · ${rangeDays(value).toLocaleString('en-GB')} day${rangeDays(value) === 1 ? '' : 's'}. No extra charge.`
              : 'Choose both dates. The migration covers exactly this period.'}
          </p>
        </div>
      )}
    </fieldset>
  );
};
