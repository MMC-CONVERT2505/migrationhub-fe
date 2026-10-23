import type { Plan } from '@/types';

/** Most total financial years anyone can ask for (matches the API's limit). */
export const MAX_MIGRATION_YEARS = 15;

type YearsPlan = Pick<Plan, 'years' | 'isInception' | 'extraYearPrice'>;

/**
 * May this person extend the plan's history? The Operation Team always may (their orders are not
 * charged); a customer only on a plan whose admin set a price per extra year. Unlimited plans have
 * nothing to extend.
 */
export function canExtendPlan(plan: YearsPlan | null | undefined, isOperator: boolean): boolean {
  if (!plan || plan.isInception || plan.years == null) return false;
  return isOperator || (plan.extraYearPrice !== null && plan.extraYearPrice !== undefined);
}

/**
 * Total financial years to migrate: the plan's own coverage unless this person may extend and chose
 * more. Never less than the plan, never past the limit, never a fraction — so a stale or tampered
 * selection can only ever fall back to the plan.
 */
export function effectiveYears(
  plan: YearsPlan | null | undefined,
  selectedYears: number | null | undefined,
  isOperator: boolean,
): number | null {
  if (!plan || plan.isInception || plan.years == null) return null;
  if (!canExtendPlan(plan, isOperator) || selectedYears == null || !Number.isInteger(selectedYears)) return plan.years;
  return selectedYears > plan.years && selectedYears <= MAX_MIGRATION_YEARS ? selectedYears : plan.years;
}

/** What the extra years cost, in the plan's currency. The Operation Team pays nothing. */
export function extensionCost(
  plan: YearsPlan | null | undefined,
  years: number | null | undefined,
  isOperator: boolean,
): number {
  if (isOperator || !plan || plan.years == null || years == null || years <= plan.years) return 0;
  const cents = Math.round(Number(plan.extraYearPrice ?? 0) * 100) * (years - plan.years);
  return cents / 100;
}

/** Plan coverage text for an extended range, e.g. 6 -> "Current Financial Year + 5 Historical Years". */
export function historyLabel(years: number): string {
  const hist = years - 1;
  return `Current Financial Year + ${hist} Historical Year${hist === 1 ? '' : 's'}`;
}

/** The choices offered: the plan's own coverage up to the limit. */
export function yearOptions(plan: Pick<Plan, 'years'>): number[] {
  const from = plan.years ?? 0;
  return Array.from({ length: Math.max(0, MAX_MIGRATION_YEARS - from + 1) }, (_, i) => from + i);
}
