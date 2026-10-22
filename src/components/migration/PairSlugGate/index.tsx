import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { Spinner } from '@/components/common/Spinner';
import { migrationPairsService } from '@/api/migrationPairs';
import { apiPairToUiPair, extractList, findPairBySlug, uiPairMatchesSlug } from '@/utils/platformMap';
import { useAppStore } from '@/store/appStore';
import type { MigrationPairEntity } from '@/types/api';

type Status = 'loading' | 'error' | 'ready';

interface PairSlugGateProps {
  /**
   * Lock the session to the migration flow (home becomes inaccessible). Only the
   * external deep-link entry does this — a pair-scoped URL shared from inside the
   * app must stay a normal, escapable page.
   */
  lockEntry?: boolean;
  /**
   * Pair slug to resolve, overriding the URL `:pairSlug`. Set by pair-dedicated routes,
   * whose path names the pair itself and so carries no slug param to read.
   */
  slug?: string;
  children: React.ReactNode;
}

/**
 * Resolves the `:pairSlug` in the URL into the selected pair, then renders the step
 * it wraps. This is what makes a pair-scoped URL directly accessible: pasted into a
 * fresh tab with an empty store, the pair is fetched from the public listing instead
 * of bouncing the visitor to the homepage.
 *
 * The URL is authoritative — a pair already in the store is reused only when its slug
 * matches, so switching slugs (or landing with a stale session) can never show the
 * wrong pair. Children mount only once a pair is resolved, so every step below can
 * read `selectedPair` and initialise its form state from it.
 */
export const PairSlugGate: React.FC<PairSlugGateProps> = ({ lockEntry = false, slug: fixedSlug, children }) => {
  const { pairSlug } = useParams<{ pairSlug: string }>();
  const slug = fixedSlug ?? pairSlug;
  const selectedPair = useAppStore((s) => s.selectedPair);
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);
  const setEntryLocked = useAppStore((s) => s.setEntryLocked);

  // Tagged with the slug it describes: navigating to another pair must not show the
  // previous pair's resolved state in the render before the effect re-runs.
  const [remote, setRemote] = useState<{ slug?: string; status: Status; error: string }>({
    status: 'loading',
    error: '',
  });
  const [retry, setRetry] = useState(0);

  // A stored pair that the URL still names. Skipping the fetch for it keeps the
  // home → details click instant, and gives us something to fall back on when the
  // listing is unreachable.
  const storeMatch = !!slug && !!selectedPair && uiPairMatchesSlug(selectedPair, slug);
  // Pairs carrying an id came from the API, so they are complete (isFree + plans)
  // and safe to render without a round-trip; the local fallback list is not.
  const resolvedFromStore = storeMatch && selectedPair?.id != null;

  useEffect(() => {
    if (!slug) {
      setRemote({ slug, status: 'error', error: 'This migration link is missing its migration pair.' });
      return;
    }
    if (resolvedFromStore) {
      setRemote({ slug, status: 'ready', error: '' });
      return;
    }

    const notFound = `We couldn't find the migration "${slug}". It may have been renamed or is no longer available.`;
    let cancelled = false;
    setRemote({ slug, status: 'loading', error: '' });

    migrationPairsService
      .available()
      .then((res) => {
        if (cancelled) return;
        const items = extractList<MigrationPairEntity>(res);
        // An empty listing means the API can't tell us anything — treat it like a
        // failure rather than as "this pair does not exist".
        if (items.length === 0) {
          setRemote(storeMatch ? { slug, status: 'ready', error: '' } : { slug, status: 'error', error: notFound });
          return;
        }
        const match = findPairBySlug(items, slug);
        if (!match) {
          setRemote({ slug, status: 'error', error: notFound });
          return;
        }
        // apiPairToUiPair carries the authoritative isFree + plans from the DB.
        setSelectedPair(apiPairToUiPair(match));
        setRemote({ slug, status: 'ready', error: '' });
      })
      .catch(() => {
        if (cancelled) return;
        // Listing unreachable: continue with the pair the user already picked
        // rather than stranding them mid-journey.
        setRemote(
          storeMatch
            ? { slug, status: 'ready', error: '' }
            : {
                slug,
                status: 'error',
                error: 'We could not load your migration right now. Please check your connection and try again.',
              },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [slug, retry, resolvedFromStore, storeMatch, setSelectedPair]);

  // Anything resolved for a different slug is stale — hold the loader until the
  // effect has re-run for the slug now in the URL.
  const status: Status = resolvedFromStore ? 'ready' : remote.slug === slug ? remote.status : 'loading';

  // Locking is deliberate and only meaningful once a pair actually resolved — a
  // lock without a pair would trap the visitor on a dead flow.
  useEffect(() => {
    if (lockEntry && status === 'ready') setEntryLocked(true);
  }, [lockEntry, status, setEntryLocked]);

  if (status === 'ready') return <>{children}</>;

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar showBack hideAuthCta />
      <div
        className="max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center"
        style={{ minHeight: '70vh', gap: 16 }}
      >
        {status === 'loading' ? (
          <>
            <Spinner size="lg" />
            <p className="text-sm text-text-secondary">Preparing your migration…</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-text-primary">Migration unavailable</h1>
            <p className="text-sm text-text-secondary">{remote.error}</p>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setRetry((n) => n + 1)}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <Link to="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Go to homepage
              </Link>
            </div>
          </>
        )}
      </div>
      <CompactFooter />
    </div>
  );
};
