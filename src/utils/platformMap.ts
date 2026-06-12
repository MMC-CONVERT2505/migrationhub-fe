import { PLATFORM_COLORS, PLATFORM_ABBR } from '@/constants/logos';

/**
 * Extracts an array from any of the API response shapes:
 *   - Direct array:                    T[]
 *   - Wrapped direct:                  { data: T[] }
 *   - Wrapped paginated:               { data: { items: T[] } }
 *   - Direct paginated:                { items: T[] }
 */
export function extractList<T>(res: unknown): T[] {
  const r = res as any;
  if (Array.isArray(r))             return r as T[];
  if (Array.isArray(r?.data))       return r.data as T[];
  if (Array.isArray(r?.data?.items)) return r.data.items as T[];
  if (Array.isArray(r?.items))      return r.items as T[];
  return [];
}
import type { MigrationPairEntity, ApiPlan } from '@/types/api';
import type { Pair, Plan } from '@/types';

// ─── API key → display name ───────────────────────────────────────────────────
const NORMALIZE: Record<string, string> = {
  qbo: 'QBO',
  xero: 'Xero',
  myob: 'MYOB',
  freshbooks: 'FreshBooks',
  tally: 'Tally',
  zoho: 'ZOHO',
  reckon: 'Reckon',
  prosaic: 'Prosaic',
};

export function normalizePlatform(key: string): string {
  return NORMALIZE[key.toLowerCase()] ?? key;
}

// ─── MigrationPairEntity → Pair (UI type) ─────────────────────────────────────
export function apiPairToUiPair(entity: MigrationPairEntity): Pair {
  const src = normalizePlatform(entity.source);
  const dst = normalizePlatform(entity.destination);
  return {
    id:        entity.id,
    src,
    dst,
    srcColor:  PLATFORM_COLORS[src] ?? '#64748b',
    dstColor:  PLATFORM_COLORS[dst] ?? '#64748b',
    srcAbbr:   PLATFORM_ABBR[src]   ?? src.slice(0, 2).toUpperCase(),
    dstAbbr:   PLATFORM_ABBR[dst]   ?? dst.slice(0, 2).toUpperCase(),
    srcLogo:   entity.sourceLogo?.image ?? null,
    dstLogo:   entity.destinationLogo?.image ?? null,
    count:     '',
    status:    entity.isFree ? 'free' : 'paid',
    isFree:    entity.isFree ?? false,
    plans:     (entity.plans ?? []).map(apiPlanToUiPlan),
    url:       null,
    toolUrl:   entity.serviceUrl ?? null,
  };
}

// ─── ApiPlan → Plan (UI type) ─────────────────────────────────────────────────
export function apiPlanToUiPlan(plan: ApiPlan): Plan {
  return {
    id:        plan.id,
    name:      plan.name,
    history:   plan.history,
    support:   plan.support,
    basePrice: Number(plan.basePrice),
    features:  plan.features,
    popular:   plan.popular,
  };
}


