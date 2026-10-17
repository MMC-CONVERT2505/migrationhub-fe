import React from 'react';
import { PairSlugGate } from '@/components/migration/PairSlugGate';
import MigrationPlanPage from '@/pages/MigrationPlanPage';

/**
 * Deep-link entry point: `/migration/details/:pairSlug/:isFree`.
 * Resolves the pair named in the URL against the public listing, selects it, and
 * locks the session to the migration flow (home becomes inaccessible). The `isFree`
 * segment is informational only — the pair's DB value is authoritative once resolved.
 * On success it renders the Migration Plan page (first screen of the flow, where a `?plan=`
 * from the website is pre-selected) so the rest of the flow is identical to the home-origin journey.
 */
const MigrationDetailsEntryPage: React.FC = () => (
  <PairSlugGate lockEntry>
    <MigrationPlanPage />
  </PairSlugGate>
);

export default MigrationDetailsEntryPage;
