import { describe, expect, it } from 'vitest';
import { ALL_SECTIONS, SECTIONS, PRIVACY_EMAIL } from '../privacyPolicy';

describe('privacy policy content', () => {
  it('has unique, URL-safe section ids (they become #anchors)', () => {
    const ids = ALL_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('numbers the sections 1–11 in order, after the "at a glance" summary', () => {
    expect(ALL_SECTIONS[0].id).toBe('at-a-glance');
    SECTIONS.forEach((s, i) => expect(s.title.startsWith(`${i + 1}. `)).toBe(true));
    expect(SECTIONS).toHaveLength(11);
  });

  it('every table row has as many cells as the header', () => {
    for (const s of ALL_SECTIONS)
      for (const b of s.blocks)
        if (b.type === 'table') for (const row of b.rows) expect(row).toHaveLength(b.head.length);
  });

  it('uses the agreed privacy contact', () => {
    expect(PRIVACY_EMAIL).toBe('migrations@mmcconvert.com');
  });
});
