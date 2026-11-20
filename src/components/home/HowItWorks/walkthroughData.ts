import { platformLogo } from '@/constants/logos';
import { calculateMigrationPeriod, formatFinancialRange } from '@/utils/financialYear';
import type { FlowKey } from './flows';

/**
 * What the walkthrough shows, copied from the real platform screens (the home page's pairs, the plan and details pages,
 * Review & pay, the Razorpay page, the connect step). Pure data and helpers, free of React, so it can be tested.
 */

export type PairStatus = 'free' | 'paid' | 'region';

export interface WalkPair {
  src: string;
  dst: string;
  status: PairStatus;
  /** Brand wordmarks the home page shows (set from the live listing); absent falls back to the bundled icon. */
  srcLogo?: string | null;
  dstLogo?: string | null;
  /** For a region pair: the countries it is free in. */
  freeCountries?: readonly string[];
}

/** The home page's migration pairs, in the order the page lists them. */
export const WALK_PAIRS: readonly WalkPair[] = [
  { src: 'myob', dst: 'qbo', status: 'free' },
  { src: 'qbo', dst: 'freshbooks', status: 'free' },
  { src: 'qbo', dst: 'myob', status: 'free' },
  { src: 'qbo', dst: 'xero', status: 'paid' },
  { src: 'tally', dst: 'zoho', status: 'paid' },
  { src: 'xero', dst: 'myob', status: 'free' },
  { src: 'xero', dst: 'prosaic', status: 'free' },
  { src: 'xero', dst: 'qbo', status: 'region' },
  { src: 'xero', dst: 'reckon', status: 'free' },
];

export const REGION_FREE_COUNTRIES = ['Australia', 'New Zealand', 'Singapore', 'United Arab Emirates', 'South Africa'] as const;

/** The home page's own pair objects (from the live listing) as walkthrough pairs, keyed the way the walkthrough is. */
export function walkPairsFrom(
  pairs: ReadonlyArray<{ src: string; dst: string; status: PairStatus; srcLogo?: string | null; dstLogo?: string | null; freeCountries?: string[] }>,
): WalkPair[] {
  return pairs.map((p) => ({
    src: p.src.toLowerCase(),
    dst: p.dst.toLowerCase(),
    status: p.status,
    srcLogo: p.srcLogo ?? null,
    dstLogo: p.dstLogo ?? null,
    freeCountries: p.freeCountries,
  }));
}

/** The pair each journey walks through (a paid one and a free one, as on the home page). */
export const JOURNEY_PAIR: Record<FlowKey, { src: string; dst: string }> = {
  paid: { src: 'qbo', dst: 'xero' },
  free: { src: 'myob', dst: 'qbo' },
};

const NAMES: Record<string, string> = {
  qbo: 'QuickBooks Online',
  xero: 'Xero',
  myob: 'MYOB',
  freshbooks: 'FreshBooks',
  tally: 'Tally',
  zoho: 'Zoho Books',
  reckon: 'Reckon',
  prosaic: 'Prosaic',
};
export const platformName = (key: string): string => NAMES[key] ?? key;
/** How the connect step names a platform ("MYOB", "QBO"). */
export const toolName = (key: string): string => key.toUpperCase();
export const logoFor = (key: string): string | null => platformLogo(key);

/** The logo sources to try, best first, without blanks or repeats. */
export const logoCandidates = (live: string | null | undefined, bundled: string | null): string[] =>
  [live, bundled].filter((u, i, all): u is string => !!u && all.indexOf(u) === i);

export interface WalkPlan {
  name: string;
  history: string;
  support: string;
  popular: boolean;
  /** Price in the customer's currency; null where the plan is free. */
  price: number;
  /** Total financial years migrated (the plan's coverage), for the date range. */
  years: number;
  chips: readonly string[];
}

export const WALK_PLANS: readonly WalkPlan[] = [
  {
    name: 'Basic',
    history: 'Current Financial Year + 1 Historical Year history',
    support: 'Email support',
    popular: false,
    price: 549,
    years: 2,
    chips: ['1 year history', 'All data categories', 'Email support', '2 revisions', 'Reconciliation report'],
  },
  {
    name: 'Standard',
    history: 'Current Financial Year + 3 Historical Years history',
    support: 'Priority email + call',
    popular: true,
    price: 849,
    years: 4,
    chips: ['3 years history', 'All data categories', 'Payroll included', 'Priority support', '5 revisions', 'Reconciliation report', 'Post-migration call'],
  },
  {
    name: 'Enterprise',
    history: 'Inception to Date history',
    support: 'Phone, chat + 30-day cover',
    popular: false,
    price: 1449,
    years: 0,
    chips: ['Unlimited history', 'All data categories', 'Payroll + multi-currency', 'Attachments', 'Dedicated senior specialist', 'Unlimited revisions', 'Phone + chat support', '30-day post-migration support'],
  },
];

/** The plan each journey picks: Standard when paying, the free Basic plan when not. */
export const CHOSEN_PLAN: Record<FlowKey, WalkPlan> = {
  paid: WALK_PLANS[1],
  free: WALK_PLANS[0],
};

export const DEMO = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  dial: '+61',
  phone: '412 345 678',
  country: 'Australia',
  currency: 'AUD',
  entity: 'Acme Pty Ltd',
  fyEnd: '30th June',
  verifiedId: '48213907',
} as const;

/** "A$1,449": the currency symbol the price list uses for Australia, thousands separated. */
export const money = (n: number): string => `A$${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

/** The date range the order summary shows for a plan, worked out exactly as the real order summary does. */
export function planRange(flow: FlowKey): string {
  const plan = CHOSEN_PLAN[flow];
  return formatFinancialRange(calculateMigrationPeriod(DEMO.fyEnd, plan.years)) ?? '';
}

/** The start and end of that range as the connect-step summary writes them ("01 Jul 2025"). */
export function planDates(flow: FlowKey): { start: string; end: string } {
  const range = calculateMigrationPeriod(DEMO.fyEnd, CHOSEN_PLAN[flow].years);
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return range?.start ? { start: fmt(range.start), end: fmt(range.end) } : { start: '', end: '' };
}

export const FAQ = {
  title: 'Frequently asked questions',
  intro: { paid: 'A few things worth knowing before you continue to payment.', free: 'A few things worth knowing before you continue to plan selection and payment.' } as Record<FlowKey, string>,
  firstAnswer: {
    paid: 'The time depends on the size of your data and the years of history, and you can track live progress on the migration screen once it starts.',
    free: 'Most migrations complete in under 30 minutes. Larger datasets with several years of history can take longer — you can track live progress on the migration screen once it starts.',
  } as Record<FlowKey, string>,
  questions: [
    'How long does a migration take?',
    'Is my data safe during the migration?',
    'What data gets migrated?',
    'Will my source data change?',
    'What happens if something fails?',
    'Do I need to pay before connecting my applications?',
  ],
};
