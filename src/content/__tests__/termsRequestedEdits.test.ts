import { describe, expect, it } from 'vitest';
import { TERMS_DATES, TERMS_SECTIONS } from '../termsOfUse';

const flat = (n: unknown): string =>
  typeof n === 'string' ? n : Array.isArray(n) ? n.map(flat).join(' ') : n && typeof n === 'object' ? Object.values(n as Record<string, unknown>).map(flat).join(' ') : '';
const TERMS = flat(TERMS_SECTIONS).replace(/\s+/g, ' ');

describe('terms of use: consistent with "specialists no longer review mappings"', () => {
  it('3.2 promises software and trained specialists, without data-mapping review', () => {
    expect(TERMS).toContain('We perform the Service with reasonable care and skill, using software and trained migration specialists.');
    expect(TERMS).not.toMatch(/specialists who review data mappings|review data mappings/);
  });
  it('still keeps the 7-day support window the new accuracy-check card relies on', () => {
    expect(TERMS).toMatch(/support window of 7 days/);
  });
  it('shows the new "Last updated" date', () => {
    expect(TERMS_DATES).toBe('Effective date: 1st Jan 2026 · Last updated: 12th November 2026');
  });
});
