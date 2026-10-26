import { beforeEach, describe, expect, it, vi } from 'vitest';

const available = vi.fn();
vi.mock('../migrationPairs', () => ({ migrationPairsService: { available: () => available() } }));

import { AVAILABLE_PAIRS_STALE_MS, getAvailablePairs, resetAvailablePairsCache } from '../availablePairs';

beforeEach(() => {
  available.mockReset();
  resetAvailablePairsCache();
  vi.useRealTimers();
});

describe('getAvailablePairs', () => {
  it('shares one request between concurrent callers', async () => {
    available.mockResolvedValue([{ id: 'a' }]);
    const [a, b] = await Promise.all([getAvailablePairs(), getAvailablePairs()]);
    expect(available).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('reuses the result inside the stale window, refetches after it', async () => {
    vi.useFakeTimers();
    available.mockResolvedValue([]);
    await getAvailablePairs();
    await getAvailablePairs();
    expect(available).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(AVAILABLE_PAIRS_STALE_MS + 1);
    await getAvailablePairs();
    expect(available).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failure, and force bypasses the cache', async () => {
    available.mockRejectedValueOnce(new Error('down')).mockResolvedValue([]);
    await expect(getAvailablePairs()).rejects.toThrow('down');
    await getAvailablePairs();
    expect(available).toHaveBeenCalledTimes(2);
    await getAvailablePairs({ force: true });
    expect(available).toHaveBeenCalledTimes(3);
  });
});
