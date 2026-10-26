import { describe, expect, it } from 'vitest';

/**
 * Privacy and Terms must not ship with "[bracketed]" drafting placeholders. These are the ones the owner still has
 * to settle (TODO(owner), listed with clause numbers in docs/prod-readiness-report.md). A NEW placeholder fails this
 * test straight away; set STRICT_LEGAL_PLACEHOLDERS=1 (the release pipeline) to fail on these as well.
 */
const KNOWN_PLACEHOLDERS = [
  '23BCAPM8108A1Z9', // Terms 1.2, Privacy 1 (GSTIN)
  'the time shown for your pair', // Terms 3.3
  '14', // Terms 9.5, Privacy 10 (notice days)
  'either party may refer it to arbitration in Indore under the Arbitration and Conciliation Act, 1996, before a sole arbitrator, in English', // Terms 9.6
  '452001', // Privacy 1 (postcode)
  'cookies or analytics tools', // Privacy 2
  'Amazon Web Services', // Privacy 5
  'Region per customer country, e.g. Sydney, Mumbai, London, US', // Privacy 5
  'AES-256', // Privacy 8
  'at least annually', // Privacy 8
  'we store uploaded files and migration data in the cloud region closest to your country (for example AWS Sydney for Australian customers)', // Privacy 6 (data location)
  'Prices exclude GST and other taxes, which are added at checkout where applicable.', // Terms 5.2
];

const STRICT = Boolean((globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.STRICT_LEGAL_PLACEHOLDERS);

const sources = import.meta.glob(['/src/content/privacyPolicy.tsx', '/src/content/termsOfUse.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const PLACEHOLDER = /(?<![\w\])])\[(?!\.\.\.)([^[\]\n'"`]{1,160})\]/g;

export function findPlaceholders(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|export |import |const |type |interface )/.test(line) || /^\s*const c\(/.test(line))
    .flatMap((line) => [...line.matchAll(PLACEHOLDER)].map((m) => m[1]));
}

describe('legal placeholders', () => {
  const found = Object.values(sources).flatMap(findPlaceholders);

  it('scans both pages', () => {
    expect(Object.keys(sources)).toHaveLength(2);
  });

  it('finds a bracketed placeholder when there is one', () => {
    expect(findPlaceholders("c('1', 'Within [14] days')")).toEqual(['14']);
    expect(findPlaceholders("head: ['Question', 'Answer'],")).toEqual([]);
  });

  it('has no placeholder beyond the known owner TODOs', () => {
    expect(found.filter((p) => !KNOWN_PLACEHOLDERS.includes(p))).toEqual([]);
  });

  it.runIf(STRICT)('has no placeholder at all (release gate)', () => {
    expect(found).toEqual([]);
  });
});
