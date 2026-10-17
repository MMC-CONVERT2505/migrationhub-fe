import { PLATFORM_COLORS, PLATFORM_ABBR, platformLogo } from '@/constants/logos';

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
    // DB banner logo wins when set; otherwise fall back to the public-folder logo
    // matched from the pair's source/destination.
    srcLogo:   entity.sourceLogo?.image ?? platformLogo(entity.source),
    dstLogo:   entity.destinationLogo?.image ?? platformLogo(entity.destination),
    count:     '',
    status:    entity.isFree ? 'free' : 'paid',
    isFree:    entity.isFree ?? false,
    plans:     (entity.plans ?? []).map(apiPlanToUiPlan),
    url:       null,
    toolUrl:   entity.serviceUrl ?? null,
  };
}

// ─── Deep-link pair slug ──────────────────────────────────────────────────────

/** Lowercase, URL-safe token from a platform key or name (e.g. "Xero" → "xero"). */
function slugToken(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Canonical deep-link slug for a pair, e.g. "xero-to-qbo". Use this to build entry links. */
export function pairSlug(source: string, destination: string): string {
  return `${slugToken(source)}-to-${slugToken(destination)}`;
}

/** Pair-scoped Migration Plan page (flow step 1), e.g. "/migration/qbo-to-myob/plan". */
export function pairPlanPath(pair: Pair): string {
  return `/migration/${pairSlug(pair.src, pair.dst)}/plan`;
}

/** Pair-scoped Customer Details page (flow step 2), e.g. "/migration/qbo-to-myob/customer-details". */
export function pairCustomerPath(pair: Pair): string {
  return `/migration/${pairSlug(pair.src, pair.dst)}/customer-details`;
}

/**
 * Entry into the post-pair-selection flow. Callers that only know "the pair is chosen,
 * continue" (the home page's pair cards, the deep-link lock) go through here, so the
 * first screen after a pair is picked lives in one place: the Migration Plan page.
 */
export function pairDetailsPath(pair: Pair): string {
  return pairPlanPath(pair);
}

/**
 * True when an already-selected UI pair is the one named by a URL `:pairSlug`.
 * Mirrors the slug shapes findPairBySlug accepts, minus displayName (a UI pair
 * does not carry it). Used to decide whether the URL still describes what is in
 * the store, so the URL — not stale state — decides which pair the user sees.
 */
export function uiPairMatchesSlug(pair: Pair, slug: string): boolean {
  const want = slugToken(slug);
  if (!want) return false;
  const src = slugToken(pair.src);
  const dst = slugToken(pair.dst);
  return (
    want === `${src}-to-${dst}` ||
    want === `${src}-${dst}` ||
    (pair.id != null && want === slugToken(String(pair.id)))
  );
}

/**
 * Resolves a URL `:pairSlug` against the available pair entities. Tolerant of the
 * shapes an external referrer might emit — "source-to-destination", "source-destination",
 * the slugified displayName, or the raw pair id — so the link keeps working regardless
 * of which convention the destination platform uses.
 */
export function findPairBySlug(
  entities: MigrationPairEntity[],
  slug: string,
): MigrationPairEntity | undefined {
  const want = slugToken(slug);
  if (!want) return undefined;
  return entities.find((e) => {
    const src = slugToken(e.source);
    const dst = slugToken(e.destination);
    return (
      want === `${src}-to-${dst}` ||
      want === `${src}-${dst}` ||
      want === slugToken(e.displayName) ||
      want === slugToken(String(e.id))
    );
  });
}

// ─── ApiPlan → Plan (UI type) ─────────────────────────────────────────────────
export function apiPlanToUiPlan(plan: ApiPlan): Plan {
  return {
    id:        plan.id,
    name:      plan.name,
    history:   plan.history,
    years:     plan.years,
    isInception: plan.isInception,
    support:   plan.support,
    basePrice: Number(plan.basePrice),
    currency:  plan.currency || undefined,
    features:  plan.features,
    popular:   plan.popular,
  };
}


