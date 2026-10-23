import { useAppStore } from '@/store/appStore';
import { useOperationTeamMember } from '@/hooks/useIsOperationTeam';
import { findSelectedPlan, isFreeSelection } from '@/constants/migrationFlow';
import { effectiveYears, extensionCost } from '@/utils/historyYears';

/**
 * Everything the checkout pages need to agree on, derived once from the store: the plan, the years
 * actually being migrated (plan coverage unless this person extended it), what the extra years
 * cost, the amount due, and whether the order is free. The server recomputes all of it.
 */
export function useCheckoutSelection() {
  const pair = useAppStore((s) => s.selectedPair);
  const planId = useAppStore((s) => s.selectedPlanId);
  const selectedYears = useAppStore((s) => s.selectedYears);
  const { isOperationTeam } = useOperationTeamMember();

  const plan = findSelectedPlan(pair, planId);
  const years = effectiveYears(plan, selectedYears, isOperationTeam);
  const extendedYears = plan && years != null && plan.years != null && years > plan.years ? years : null;
  const extension = extensionCost(plan, years, isOperationTeam);
  const total = plan ? Number(plan.basePrice) + extension : 0;
  const isFree = isFreeSelection(pair, plan, extension);

  return { pair, plan, years, extendedYears, extension, total, isFree, isOperationTeam };
}
