import React from 'react';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import MigrationInfoPage from '@/pages/MigrationInfoPage';

/**
 * Flow step 2 (Customer Details), scoped to the pair in the URL:
 * `/migration/:pairSlug/customer-details` — e.g. `/migration/qbo-to-myob/customer-details`.
 *
 * Because the pair is named in the path, the link is directly accessible: it can be
 * bookmarked, shared, or opened in a fresh tab and still resolves to the right flow.
 * MigrationInfoPage sends the visitor back to the Plan page if no plan is chosen yet.
 */
const MigrationDetailsPage: React.FC = () => (
  <PairSlugGate step="details">
    <MigrationInfoPage />
  </PairSlugGate>
);

export default MigrationDetailsPage;
