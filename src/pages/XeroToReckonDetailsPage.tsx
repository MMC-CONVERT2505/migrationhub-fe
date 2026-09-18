import React from 'react';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import MigrationInfoPage from '@/pages/MigrationInfoPage';
import { XERO_RECKON_DETAILS_PATH, XERO_RECKON_SLUG } from '@/constants/xeroReckon';

/**
 * Journey step 2 (Migration Details) for Xero → Reckon One, on its own dedicated route:
 * `{@link XERO_RECKON_DETAILS_PATH}`.
 *
 * The pair is pinned in the route itself rather than read from a URL param, so the
 * link resolves to Xero → Reckon One whoever opens it — pasted into a fresh tab,
 * bookmarked, or reloaded with an empty store, PairSlugGate fetches the pair from the
 * public listing before step 2 mounts. Step 2 itself is the shared MigrationInfoPage,
 * so the flow past this page is identical to every other pair's.
 */
const XeroToReckonDetailsPage: React.FC = () => (
  <PairSlugGate slug={XERO_RECKON_SLUG}>
    <MigrationInfoPage />
  </PairSlugGate>
);

export default XeroToReckonDetailsPage;
