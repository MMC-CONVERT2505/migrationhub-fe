import type { InquiryDetails, Pair, Plan } from '@/types';
import { pairCustomerPath, pairPlanPath } from '@/utils/platformMap';

/** The four stepper stages shown on every post-pair-selection page. */
export const FLOW_STEPS = [
  { key: 'prepare', label: 'Prepare' },
  { key: 'pay', label: 'Pay' },
  { key: 'connect', label: 'Connect' },
  { key: 'migrate', label: 'Migrate' },
] as const;

/** A free selection never reaches the Payment page, so its stepper has no "Pay" stage. */
export const flowSteps = (free: boolean): readonly (typeof FLOW_STEPS)[number][] =>
  free ? FLOW_STEPS.filter((s) => s.key !== 'pay') : FLOW_STEPS;

export type FlowStepKey = (typeof FLOW_STEPS)[number]['key'];

/** Pages that take part in the flow. `connect` and `track` live outside the checkout pages
 *  but still name their stepper stage here so the mapping stays in one place. */
export type FlowPage = 'plan' | 'details' | 'payment' | 'success' | 'connect' | 'track';

/** Plan + Customer Details = Prepare, Payment + Success = Pay, account login = Connect, tracker = Migrate. */
export const FLOW_PAGE_STEP: Record<FlowPage, FlowStepKey> = {
  plan: 'prepare',
  details: 'prepare',
  payment: 'pay',
  success: 'pay',
  connect: 'connect',
  track: 'migrate',
};

/**
 * 1-based stepper position of a page. In a free flow the "Pay" stage does not exist, so the
 * success page (the hand-off into connecting the accounts) counts as Connect.
 */
export const flowStepNumber = (page: FlowPage, free = false): number => {
  const key = free && FLOW_PAGE_STEP[page] === 'pay' ? 'connect' : FLOW_PAGE_STEP[page];
  return flowSteps(free).findIndex((s) => s.key === key) + 1;
};

export const DEFAULT_CURRENCY = 'USD';
export const PAYMENT_PATH = '/payment';
export const SUCCESS_PATH = '/payment/success';

export const planCurrency = (plan: Pick<Plan, 'currency'> | null | undefined): string =>
  plan?.currency || DEFAULT_CURRENCY;

/** Free when the pair is marketed free or the chosen plan costs nothing. */
export const isFreeSelection = (pair: Pair | null, plan: Plan | null): boolean =>
  (pair?.isFree ?? false) || (plan != null && Number(plan.basePrice) === 0);

/** What a free pair's plan includes — shown instead of the plan's own name, price and feature list. */
export const FREE_PAIR_BENEFITS = ['All data categories', 'Email + Phone support', 'Quality Analysis Report'] as const;

/** True for the zero-cost plan of a free pair, which is presented as just its history + FREE_PAIR_BENEFITS. */
export const usesFreePairBenefits = (pair: Pair | null, plan: Pick<Plan, 'basePrice'>): boolean =>
  (pair?.isFree ?? false) && Number(plan.basePrice) === 0;

/** A pair with attached plans needs one chosen. A free pair with none can proceed without. */
export const planRequired = (pair: Pair): boolean => pair.plans.length > 0 || !pair.isFree;

/** The plan in the store, only if it actually belongs to the pair — a stale id from another pair is ignored. */
export const findSelectedPlan = (pair: Pair | null, planId: string | null): Plan | null =>
  pair?.plans.find((p) => p.id === planId) ?? null;

/** The inquiry in the store, only if it was created for this pair and can still be edited. */
export const inquiryForPair = (pair: Pair | null, inquiry: InquiryDetails | null): InquiryDetails | null =>
  pair && inquiry?.id != null && (inquiry.migrationPairId == null || inquiry.migrationPairId === String(pair.id))
    ? inquiry
    : null;

export interface FlowState {
  pair: Pair | null;
  planId: string | null;
  inquiry: InquiryDetails | null;
  /** Operation Team members start a paid plan without paying. */
  paymentSkipped?: boolean;
  /** Razorpay paymentId present in the callback URL (success page only). */
  paymentId?: string | null;
}

/**
 * Where a visitor must be sent if `page` is missing something an earlier step collects, or
 * null when the page can render. Always the earliest incomplete step, so a refresh, a
 * pasted URL or a stale bookmark can never land mid-flow with nothing to show.
 */
export function resolveFlowRedirect(page: 'plan' | 'details' | 'payment' | 'success', s: FlowState): string | null {
  const { pair } = s;
  if (!pair) return '/';
  if (page === 'plan') return null;

  const plan = findSelectedPlan(pair, s.planId);
  if (planRequired(pair) && !plan) return pairPlanPath(pair);
  if (page === 'details') return null;

  if (!inquiryForPair(pair, s.inquiry)) return pairCustomerPath(pair);

  const free = isFreeSelection(pair, plan);
  if (page === 'payment') return free || s.paymentSkipped ? SUCCESS_PATH : null;

  // success: a paid plan needs a payment (or the Operation Team skip) behind it.
  return !free && !s.paymentSkipped && !s.paymentId ? PAYMENT_PATH : null;
}
