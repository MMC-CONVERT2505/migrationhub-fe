import { useAppStore } from '@/store/appStore';
import { useOperationTeamMember } from '@/hooks/useIsOperationTeam';
import { findSelectedPlan, isFreeSelection } from '@/constants/migrationFlow';
import { effectiveYears, extensionCost } from '@/utils/historyYears';
import { orderTotals } from '@/utils/countryPricing';
import { effectiveDateRange } from '@/utils/dateRange';

/**
 * Everything the checkout pages need to agree on, derived once from the store: the plan, the years
 * actually being migrated (plan coverage unless this person extended it), what the extra years
 * cost, the amount due, and whether the order is free. The server recomputes all of it.
 */
export function useCheckoutSelection() {
  const pair = useAppStore((s) => s.selectedPair);
  const planId = useAppStore((s) => s.selectedPlanId);
  const selectedYears = useAppStore((s) => s.selectedYears);
  const selectedDateRange = useAppStore((s) => s.selectedDateRange);
  const country = useAppStore((s) => s.selectedCountry);
  const { isOperationTeam } = useOperationTeamMember();

  const plan = findSelectedPlan(pair, planId, country);
  // Operation Team only: an exact From/To period replaces the years choice (never both, never for anyone else).
  const customRange = effectiveDateRange(selectedDateRange, isOperationTeam);
  const years = customRange ? null : effectiveYears(plan, selectedYears, isOperationTeam);
  const extendedYears = plan && years != null && plan.years != null && years > plan.years ? years : null;
  const extension = customRange ? 0 : extensionCost(plan, years, isOperationTeam);
  const { subtotal, tax, total } = orderTotals(plan, extension);
  const isFree = isFreeSelection(pair, plan, extension);

  return { pair, plan, country, years, extendedYears, customRange, extension, subtotal, tax, total, isFree, isOperationTeam };
}
