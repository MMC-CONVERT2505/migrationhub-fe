import { useAppStore } from '@/store/appStore';
import { useOperationTeamMember } from '@/hooks/useIsOperationTeam';
import { findSelectedPlan, isFreeSelection } from '@/constants/migrationFlow';
import { effectiveYears, extensionCost } from '@/utils/historyYears';
import { orderTotals } from '@/utils/countryPricing';

/**
 * Everything the checkout pages need to agree on, derived once from the store: the plan, the years
 * actually being migrated (plan coverage unless this person extended it), what the extra years
 * cost, the amount due, and whether the order is free. The server recomputes all of it.
 */
export function useCheckoutSelection() {
  const pair = useAppStore((s) => s.selectedPair);
  const planId = useAppStore((s) => s.selectedPlanId);
  const selectedYears = useAppStore((s) => s.selectedYears);
  const country = useAppStore((s) => s.selectedCountry);
  const { isOperationTeam } = useOperationTeamMember();

  const plan = findSelectedPlan(pair, planId, country);
  const years = effectiveYears(plan, selectedYears, isOperationTeam);
  const extendedYears = plan && years != null && plan.years != null && years > plan.years ? years : null;
  const extension = extensionCost(plan, years, isOperationTeam);
  const { subtotal, tax, total } = orderTotals(plan, extension);
  const isFree = isFreeSelection(pair, plan, extension);

  return { pair, plan, country, years, extendedYears, extension, subtotal, tax, total, isFree, isOperationTeam };
}
