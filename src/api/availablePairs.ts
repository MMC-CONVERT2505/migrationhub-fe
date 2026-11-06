import { migrationPairsService } from './migrationPairs';

type Listing = Awaited<ReturnType<typeof migrationPairsService.available>>;

/** The catalogue changes rarely; the server also caches it for a minute. */
export const AVAILABLE_PAIRS_STALE_MS = 60_000;

let cached: { at: number; data: Listing } | null = null;
let inflight: Promise<Listing> | null = null;

/**
 * The public pair listing, fetched once and shared: concurrent callers join one request, and callers within
 * the stale window reuse the last result. Failures are never cached. `force` skips the cache (retry buttons).
 */
export function getAvailablePairs(opts: { force?: boolean } = {}): Promise<Listing> {
  if (!opts.force && cached && Date.now() - cached.at < AVAILABLE_PAIRS_STALE_MS) {
    return Promise.resolve(cached.data);
  }
  if (inflight) return inflight;
  const request: Promise<Listing> = migrationPairsService
    .available()
    .then((data) => {
      cached = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      if (inflight === request) inflight = null;
    });
  inflight = request;
  return request;
}

/** Test hook: forget everything cached. */
export function resetAvailablePairsCache(): void {
  cached = null;
  inflight = null;
}
