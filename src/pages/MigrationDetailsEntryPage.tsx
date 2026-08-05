import React from 'react';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import MigrationInfoPage from '@/pages/MigrationInfoPage';

/**
 * Deep-link entry point: `/migration/details/:pairSlug/:isFree`.
 * Resolves the pair named in the URL against the public listing, selects it, and
 * locks the session to the migration flow (home becomes inaccessible). The `isFree`
 * segment is informational only — the pair's DB value is authoritative once resolved.
 * On success it renders the normal Migration Details page so the rest of the flow is
 * identical to the home-origin journey.
 */
const MigrationDetailsEntryPage: React.FC = () => (
  <PairSlugGate lockEntry>
    <MigrationInfoPage />
  </PairSlugGate>
);

export default MigrationDetailsEntryPage;
