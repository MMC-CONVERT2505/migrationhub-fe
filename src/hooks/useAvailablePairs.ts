import { useEffect, useState } from 'react';
import { getAvailablePairs } from '@/api/availablePairs';
import { extractList } from '@/utils/platformMap';
import type { MigrationPairEntity } from '@/types/api';

export interface CatalogueCounts {
  pairs: number;
  platforms: number;
}

export function catalogueCounts(items: Array<Pick<MigrationPairEntity, 'source' | 'destination'>>): CatalogueCounts {
  const platforms = new Set<string>();
  items.forEach((p) => {
    platforms.add(p.source.toLowerCase());
    platforms.add(p.destination.toLowerCase());
  });
  return { pairs: items.length, platforms: platforms.size };
}

/** How many pairs and platforms the API offers; null while loading, undefined if it could not be loaded. */
export function useCatalogueCounts(): CatalogueCounts | null | undefined {
  const [counts, setCounts] = useState<CatalogueCounts | null | undefined>(null);
  useEffect(() => {
    let live = true;
    getAvailablePairs()
      .then((res) => live && setCounts(catalogueCounts(extractList<MigrationPairEntity>(res))))
      .catch(() => live && setCounts(undefined));
    return () => {
      live = false;
    };
  }, []);
  return counts;
}
