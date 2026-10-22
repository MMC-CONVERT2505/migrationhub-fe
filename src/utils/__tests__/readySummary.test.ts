import { describe, expect, it } from 'vitest';
import { readySummaryRows } from '../readySummary';

const full = {
  inquiry: { name: 'Jane Doe', entityName: 'Acme Pty Ltd', country: 'Australia (AUD)' },
  history: 'Current Financial Year + 1 Historical Year',
  financialYearEnd: '30th June',
  dateRange: '1 Jul 2024 – 30 Jun 2026',
};

describe('readySummaryRows', () => {
  it('lists exactly the agreed fields in order — no Plan, no Support', () => {
    expect(readySummaryRows(full).map((r) => r.label)).toEqual([
      'Name', 'Name of entity to be migrated', 'Country', 'Historical period', 'FY end', 'Date range',
    ]);
  });
  it('shows the country without its currency', () => {
    expect(readySummaryRows(full).find((r) => r.label === 'Country')?.value).toBe('Australia');
  });
  it('drops blank or missing values rather than showing empty rows', () => {
    const rows = readySummaryRows({ inquiry: { name: '  ', entityName: 'Acme', country: null }, history: '', financialYearEnd: undefined, dateRange: null });
    expect(rows).toEqual([{ label: 'Name of entity to be migrated', value: 'Acme' }]);
  });
  it('copes with no inquiry at all', () => {
    expect(readySummaryRows({ inquiry: null, history: 'H' })).toEqual([{ label: 'Historical period', value: 'H' }]);
    expect(readySummaryRows({ inquiry: undefined })).toEqual([]);
  });
  it('trims values', () => {
    expect(readySummaryRows({ inquiry: { name: ' Jane ' } })[0].value).toBe('Jane');
  });
});
