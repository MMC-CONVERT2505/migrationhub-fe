import React from 'react';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import MigrationInfoPage from '@/pages/MigrationInfoPage';

/**
 * Journey step 2 (Migration Details), scoped to the pair in the URL:
 * `/migration/:pairSlug/details` — e.g. `/migration/qbo-to-myob/details`.
 *
 * Because the pair is named in the path, the link is directly accessible: it can be
 * bookmarked, shared, or opened in a fresh tab and still resolves to the right flow.
 * The plain `/migration/details` URL could not, since the pair only lived in session state.
 */
const MigrationDetailsPage: React.FC = () => (
  <PairSlugGate>
    <MigrationInfoPage />
  </PairSlugGate>
);

export default MigrationDetailsPage;
