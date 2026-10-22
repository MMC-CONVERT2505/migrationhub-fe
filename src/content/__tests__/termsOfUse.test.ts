import { describe, expect, it } from 'vitest';
import { TERMS_SECTIONS } from '../termsOfUse';

const nums = TERMS_SECTIONS.flatMap((s) => s.blocks.flatMap((b) => (b.type === 'p' && b.num ? [b.num] : [])));

describe('terms of use content', () => {
  it('has 10 numbered sections with unique URL-safe ids', () => {
    expect(TERMS_SECTIONS).toHaveLength(10);
    const ids = TERMS_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(10);
    ids.forEach((id) => expect(id).toMatch(/^[a-z][a-z0-9-]*$/));
    TERMS_SECTIONS.forEach((s, i) => expect(s.title.startsWith(`${i + 1}. `)).toBe(true));
  });
  it('clause numbers are unique, in order, and sit under their own section', () => {
    expect(new Set(nums).size).toBe(nums.length);
    TERMS_SECTIONS.forEach((s, i) => {
      const own = s.blocks.flatMap((b) => (b.type === 'p' && b.num ? [b.num] : []));
      own.forEach((n, j) => expect(n).toBe(`${i + 1}.${j + 1}`));
    });
  });
  it('has the agreed clause counts per section and 2 bullet lists', () => {
    const counts = TERMS_SECTIONS.map((s) => s.blocks.filter((b) => b.type === 'p' && b.num).length);
    expect(counts).toEqual([4, 4, 7, 7, 7, 5, 4, 6, 8, 0]);
    expect(TERMS_SECTIONS.flatMap((s) => s.blocks).filter((b) => b.type === 'list')).toHaveLength(2);
  });
});
