import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MigrationInfoPage from '@/pages/MigrationInfoPage';
import { Navbar } from '@/components/layout/Navbar';
import { Spinner } from '@/components/common/Spinner';
import { migrationPairsService } from '@/api/migrationPairs';
import { apiPairToUiPair, extractList, findPairBySlug } from '@/utils/platformMap';
import { useAppStore } from '@/store/appStore';
import type { MigrationPairEntity } from '@/types/api';

type Status = 'loading' | 'error' | 'ready';

/**
 * Deep-link entry point: `/migration/details/:pairSlug/:isFree`.
 * Resolves the pair named in the URL against the public listing, selects it, and
 * locks the session to the migration flow (home becomes inaccessible). The `isFree`
 * segment is informational only — the pair's DB value is authoritative once resolved.
 * On success it renders the normal Migration Details page so the rest of the flow is
 * identical to the home-origin journey.
 */
const MigrationDetailsEntryPage: React.FC = () => {
  const { pairSlug } = useParams<{ pairSlug: string; isFree: string }>();
  const setSelectedPair = useAppStore((s) => s.setSelectedPair);
  const setEntryLocked = useAppStore((s) => s.setEntryLocked);

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!pairSlug) {
      setError('This migration link is missing its migration pair.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    migrationPairsService
      .available()
      .then((res) => {
        if (cancelled) return;
        const items = extractList<MigrationPairEntity>(res);
        const match = findPairBySlug(items, pairSlug);
        if (!match) {
          setError(`We couldn't find the migration "${pairSlug}". It may have been renamed or is no longer available.`);
          setStatus('error');
          return;
        }
        // apiPairToUiPair carries the authoritative isFree + plans from the DB.
        setSelectedPair(apiPairToUiPair(match));
        setEntryLocked(true);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setError('We could not load your migration right now. Please check your connection and try again.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [pairSlug, retry, setSelectedPair, setEntryLocked]);

  if (status === 'ready') return <MigrationInfoPage />;

  return (
    <div className="min-h-screen bg-bg">
      <Navbar variant="migration" />
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
            <p className="text-sm text-text-secondary">{error}</p>
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
    </div>
  );
};

export default MigrationDetailsEntryPage;
