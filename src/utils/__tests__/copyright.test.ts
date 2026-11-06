import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyrightNotice, currentYear } from '../copyright';

afterEach(() => vi.useRealTimers());

describe('copyright', () => {
  it('uses the year at render time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-01T00:00:00Z'));
    expect(currentYear()).toBe(2031);
    expect(copyrightNotice()).toBe('© 2031 MMC Convert. All rights reserved.');
  });
});
