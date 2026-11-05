import { describe, expect, it } from 'vitest';
import { contentBox, paddedCrop } from '../trimLogo';

/** w x h image, white, with a black block at the given pixel rectangle. */
const img = (w: number, h: number, r?: [number, number, number, number], transparent = false) => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 255; d[i * 4 + 3] = transparent ? 0 : 255; }
  if (r) for (let y = r[1]; y < r[3]; y++) for (let x = r[0]; x < r[2]; x++) { const i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 0; d[i + 3] = 255; }
  return d;
};

describe('contentBox', () => {
  it('finds the logo inside a white margin', () => {
    expect(contentBox(img(100, 100, [10, 40, 90, 60]), 100, 100)).toEqual({ left: 10, top: 40, right: 90, bottom: 60 });
  });
  it('ignores a transparent margin', () => {
    expect(contentBox(img(50, 50, [20, 20, 30, 30], true), 50, 50)).toEqual({ left: 20, top: 20, right: 30, bottom: 30 });
  });
  it('is null for a blank image', () => {
    expect(contentBox(img(20, 20), 20, 20)).toBeNull();
    expect(contentBox(img(20, 20, undefined, true), 20, 20)).toBeNull();
  });
});

describe('paddedCrop', () => {
  it('crops a logo lost in a big canvas, keeping a small margin', () => {
    const c = paddedCrop({ left: 30, top: 200, right: 570, bottom: 394 }, 600, 600)!;
    expect(c.top).toBeLessThan(200); expect(c.bottom).toBeGreaterThan(394);
    expect(c.bottom - c.top).toBeLessThan(260); expect(c.left).toBeGreaterThanOrEqual(0); expect(c.right).toBeLessThanOrEqual(600);
  });
  it('leaves an already-tight logo alone', () => {
    expect(paddedCrop({ left: 0, top: 0, right: 443, bottom: 114 }, 443, 114)).toBeNull();
    expect(paddedCrop({ left: 5, top: 6, right: 438, bottom: 108 }, 443, 114)).toBeNull();
  });
  it('is null when there is nothing to crop to', () => {
    expect(paddedCrop(null, 100, 100)).toBeNull();
  });
});

import { logoHeight } from '@/components/home/WorksWith';
describe('logoHeight', () => {
  it('makes compact logos taller than long thin ones, within limits', () => {
    expect(logoHeight(2.3)).toBeGreaterThan(logoHeight(4.6));
    expect(logoHeight(1)).toBe(52);
    expect(logoHeight(6.5)).toBe(36);
  });
  it('falls back for an unknown shape', () => {
    expect(logoHeight(0)).toBe(40);
    expect(logoHeight(NaN)).toBe(40);
  });
});
