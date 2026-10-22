import { countryDisplayName } from '@/utils/country';

export interface ReadySummaryInput {
  inquiry: { name?: string | null; entityName?: string | null; country?: string | null } | null | undefined;
  /** Plan's coverage text, e.g. "Current Financial Year + 1 Historical Year". */
  history?: string | null;
  financialYearEnd?: string | null;
  dateRange?: string | null;
}

const clean = (v?: string | null) => v?.trim() || null;

/**
 * The rows on the "Migration Ready" / "Payment Confirmed" summary, in order: who and what is being
 * migrated, then the period covered. A value that is missing or blank drops its row instead of
 * showing an empty line, so a partly-filled session can never render "Name: ".
 */
export function readySummaryRows(i: ReadySummaryInput): { label: string; value: string }[] {
  const country = clean(i.inquiry?.country);
  const rows: [string, string | null][] = [
    ['Name', clean(i.inquiry?.name)],
    ['Name of entity to be migrated', clean(i.inquiry?.entityName)],
    ['Country', country ? countryDisplayName(country) : null],
    ['Historical period', clean(i.history)],
    ['FY end', clean(i.financialYearEnd)],
    ['Date range', clean(i.dateRange)],
  ];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, value]) => ({ label, value }));
}
