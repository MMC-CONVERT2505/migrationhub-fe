import { describe, expect, it } from 'vitest';
import { PLATFORM_GROUPS, PLATFORM_KEYS } from '../platforms';
import { findPairBySlug, pairSlug } from '@/utils/platformMap';
import catalogue from '../../../e2e/op-team-date-range/catalogue.json';
import type { MigrationPairEntity } from '@/types/api';

const entities = catalogue as unknown as MigrationPairEntity[];
const allPairs = PLATFORM_GROUPS.flatMap((g) => g.destinations.map((d) => ({ source: g.source, destination: d })));

describe('supported platforms page links', () => {
  it('has a catalogue key for every platform it lists', () => {
    for (const p of allPairs) {
      expect(PLATFORM_KEYS[p.source], p.source).toBeTruthy();
      expect(PLATFORM_KEYS[p.destination], p.destination).toBeTruthy();
    }
  });

  it('links every listed pair to a pair the catalogue actually has', () => {
    for (const p of allPairs) {
      const slug = pairSlug(PLATFORM_KEYS[p.source], PLATFORM_KEYS[p.destination]);
      expect(findPairBySlug(entities, slug), `${p.source} to ${p.destination} (${slug})`).toBeDefined();
    }
  });

  it('lists every catalogue pair exactly once', () => {
    const slugs = allPairs.map((p) => pairSlug(PLATFORM_KEYS[p.source], PLATFORM_KEYS[p.destination]));
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.length).toBe(entities.length);
  });

  it('builds the slug from catalogue keys, not display names', () => {
    expect(pairSlug(PLATFORM_KEYS['QuickBooks Online'], PLATFORM_KEYS['Xero'])).toBe('qbo-to-xero');
    expect(pairSlug(PLATFORM_KEYS['Tally'], PLATFORM_KEYS['Zoho Books'])).toBe('tally-to-zoho');
  });
});
