import { describe, expect, it } from 'vitest';
import { clampSkip, pageCount, pageWindow, parseListResponse } from '../pagination';

describe('parseListResponse', () => {
  it('reads the users shape { count, skip, take, data[] } — the one that hid the pager', () => {
    const r = parseListResponse<number>({ count: 51, skip: 0, take: 20, data: [1, 2, 3] });
    expect(r).toEqual({ rows: [1, 2, 3], total: 51 });
  });
  it('reads { data[], total }, { data: { items, total } }, { items, total } and a bare array', () => {
    expect(parseListResponse({ data: [1], total: 9 })).toEqual({ rows: [1], total: 9 });
    expect(parseListResponse({ data: { items: [1, 2], total: 7 } })).toEqual({ rows: [1, 2], total: 7 });
    expect(parseListResponse({ items: [1], total: 4 })).toEqual({ rows: [1], total: 4 });
    expect(parseListResponse([1, 2, 3])).toEqual({ rows: [1, 2, 3], total: 3 });
  });
  it('never reports fewer than the rows it has, and survives junk', () => {
    expect(parseListResponse({ data: [1, 2, 3], total: 1 }).total).toBe(3);
    expect(parseListResponse({ data: [1, 2], count: 'x' }).total).toBe(2);
    expect(parseListResponse(null)).toEqual({ rows: [], total: 0 });
    expect(parseListResponse(undefined)).toEqual({ rows: [], total: 0 });
    expect(parseListResponse({ count: 0, data: [] })).toEqual({ rows: [], total: 0 });
  });
});

describe('page maths', () => {
  it('counts pages', () => {
    expect(pageCount(0, 20)).toBe(0);
    expect(pageCount(1, 20)).toBe(1);
    expect(pageCount(20, 20)).toBe(1);
    expect(pageCount(21, 20)).toBe(2);
    expect(pageCount(51, 20)).toBe(3);
  });
  it('clamps a stale offset to the last page', () => {
    expect(clampSkip(40, 51, 20)).toBe(40);
    expect(clampSkip(60, 51, 20)).toBe(40); // list shrank
    expect(clampSkip(20, 0, 20)).toBe(0);
    expect(clampSkip(-5, 51, 20)).toBe(0);
    expect(clampSkip(40, 51, 100)).toBe(0); // page size grew
  });
});

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(2, 1)).toEqual([1]);
    expect(pageWindow(1, 0)).toEqual([]);
  });
  it('collapses long ranges around the current page', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 'gap', 10]);
    expect(pageWindow(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(pageWindow(10, 10)).toEqual([1, 'gap', 9, 10]);
  });
  it('does not hide a single page behind an ellipsis', () => {
    expect(pageWindow(4, 10)).toEqual([1, 2, 3, 4, 5, 'gap', 10]);
  });
});
