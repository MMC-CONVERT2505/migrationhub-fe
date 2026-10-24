import type { Pair, Plan } from '@/types';
import { pairSlug } from '@/utils/platformMap';

/**
 * Pairs that also have a dedicated flow, entered ONLY through the website deep link
 * (`/migration/details/<slug>/…`): the Free plan is taken for the person, customer-details is the only stop, and
 * there is no way back to the plan page, the Hub home page or another pair until the migration is done.
 * Entering from the Hub home page is the normal flow, like every other pair.
 */
export const DEDICATED_PAIR_SLUGS: readonly string[] = ['xero-to-reckon'];

/** Query parameter that carries the flow token on the pair's customer-details URL. */
export const FLOW_PARAM = 'flow';

/** Issued when a person enters through the website deep link; lives in this tab's session only. */
export interface DedicatedFlow {
  slug: string;
  token: string;
}

/** The pair's canonical slug, whatever form the URL used to reach it ("xero-reckon", its id, its display name…). */
export const canonicalSlug = (pair: Pair): string => pairSlug(pair.src, pair.dst);

export const isDedicatedSlug = (slug: string | null | undefined): boolean =>
  !!slug && DEDICATED_PAIR_SLUGS.includes(slug);

export const isDedicatedPair = (pair: Pair | null | undefined): boolean =>
  !!pair && isDedicatedSlug(canonicalSlug(pair));

/** Unguessable per-entry token. crypto.randomUUID needs a secure context; fall back to getRandomValues. */
export function newFlowToken(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Customer-details URL of a dedicated pair, carrying its token. */
export const dedicatedDetailsPath = (flow: DedicatedFlow): string =>
  `/migration/${flow.slug}/customer-details?${FLOW_PARAM}=${encodeURIComponent(flow.token)}`;

/** Where the plan step's Continue goes: the token-carrying details URL inside a dedicated flow, else the plain one. */
export const detailsPathFor = (pair: Pair, flow: DedicatedFlow | null): string =>
  flow && flow.slug === canonicalSlug(pair) ? dedicatedDetailsPath(flow) : `/migration/${canonicalSlug(pair)}/customer-details`;

/**
 * True when this tab's dedicated flow has no plan step to show: the Free plan is taken for the person on entry,
 * so customer-details is the only stop. Back, the logo, the home page and "Change plan" all resolve to it
 * rather than to the plan page. (When there is no Free plan to take, the plan page stays a normal step.)
 */
export const skipsPlanStep = (pair: Pair | null | undefined, flow: DedicatedFlow | null): boolean =>
  !!pair && !!flow && flow.slug === canonicalSlug(pair) && dedicatedFreePlan(pair) !== null;

export type DedicatedStep = 'plan' | 'details';

interface GuardInput {
  /** The pair this URL resolved to. */
  pair: Pair;
  /** The active flow for this tab, if any. */
  flow: DedicatedFlow | null;
  /** The `flow` query parameter on this URL, if any. */
  urlToken: string | null;
  step: DedicatedStep;
}

/**
 * Where this visit must go instead of the page it asked for, or null when it may proceed.
 * Only an active dedicated flow (started by the deep link in this tab) restricts anything; without one, every pair —
 * the dedicated ones included — behaves as a normal pair.
 *  - Inside the flow, any other pair goes back to the flow.
 *  - Inside the flow, the details page must carry this tab's token, so a stale or edited URL is put right.
 */
export function dedicatedFlowRedirect({ pair, flow, urlToken, step }: GuardInput): string | null {
  if (!flow) return null;
  if (flow.slug !== canonicalSlug(pair)) return dedicatedDetailsPath(flow);
  if (step === 'details' && urlToken !== flow.token) return dedicatedDetailsPath(flow);
  return null;
}

/**
 * The Free plan to take for the person, or null when this pair needs a manual choice (not free, or its
 * plans have no free one). `none` = a free pair with no plans attached, which proceeds with no plan.
 */
export function dedicatedFreePlan(pair: Pair): Plan | 'none' | null {
  if (!pair.isFree) return null;
  if (pair.plans.length === 0) return 'none';
  return pair.plans.find((p) => Number(p.basePrice) === 0 && !p.isInception) ?? null;
}
