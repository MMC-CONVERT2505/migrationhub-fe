import { describe, expect, it } from 'vitest';
import { CERTIFICATION, CONTROL, DATA_JOURNEY, PROTECTIONS, SECURITY_BADGES, SECURITY_CONTACT, SECURITY_INTRO, SECURITY_UPDATED } from '../security';

/** Every piece of text on the page (not its JSON punctuation). */
const strings = (v: unknown): string[] => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);
const all = strings([SECURITY_INTRO, SECURITY_BADGES, DATA_JOURNEY, PROTECTIONS, CONTROL, CERTIFICATION, SECURITY_CONTACT]).join('\n');

describe('Security page content (from the MMC document)', () => {
  it('has the six headline badges, in order', () => {
    expect(SECURITY_BADGES).toEqual([
      'ISO/IEC 27001:2022 certified',
      'TLS 1.2 in transit',
      'Encrypted at rest',
      'Role-based access',
      'No sub-processors',
      'Automatic deletion',
    ]);
  });

  it('walks through the five steps in order, with the Day 0 and Day 7 markers', () => {
    expect(DATA_JOURNEY.steps.map((s) => s.title)).toEqual(['Upload', 'Conversion', 'Quality check (optional)', 'Job complete', 'Deletion']);
    expect(DATA_JOURNEY.steps.map((s) => s.when ?? null)).toEqual(['Day 0', null, null, null, 'Day 7']);
    expect(DATA_JOURNEY.steps[4].text).toContain('kept for up to 7 days');
    expect(DATA_JOURNEY.steps[4].text).toContain('deleted automatically on the eighth day after conversion');
  });

  it('lists the eight protections, each with its own icon and wording', () => {
    expect(PROTECTIONS.items.map((i) => i.title)).toEqual([
      'Private cloud environment', 'Encryption', 'Least-privilege access', 'Strong credentials',
      'Regular testing', 'Malware protection', 'Backup and recovery', 'Incident response',
    ]);
    expect(new Set(PROTECTIONS.items.map((i) => i.icon)).size).toBe(8);
    expect(PROTECTIONS.items[2].text).toContain('secure VPN only');
    expect(PROTECTIONS.items[4].text).toContain('every quarter');
  });

  it('has the four "you stay in control" promises and the six certification rows', () => {
    expect(CONTROL.items).toHaveLength(4);
    expect(CERTIFICATION.rows.map((r) => r.term)).toEqual([
      'ISO/IEC 27001:2022', 'Written policies', 'Use of your data', 'Sub-processors', 'Records of processing', 'Data location',
    ]);
    expect(CERTIFICATION.rows[0].text).toContain('MMC Convert’s Information Security Management System is certified');
  });

  it('is dated November 2026 and asks for security questions', () => {
    expect(SECURITY_UPDATED).toBe('November 2026');
    expect(SECURITY_CONTACT.heading).toBe('Have a security question?');
  });

  it('keeps the page consistent with itself: one TLS version, one retention schedule, no other certification', () => {
    expect(all).not.toMatch(/TLS 1\.[013]\b|TLS 2/);
    expect(all).not.toMatch(/SOC ?2|HIPAA|PCI|GDPR/i);
    expect(all.match(/ISO\/IEC [0-9]+:[0-9]+/g)?.every((m) => m === 'ISO/IEC 27001:2022')).toBe(true);
  });

  it('has no placeholder or draft text left in it', () => {
    expect(all).not.toMatch(/TODO|lorem|TBD|xxx|\[.*\]|Page 2/i);
  });
});
