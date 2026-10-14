import { useOperationTeamMember } from './useIsOperationTeam';

interface PricedPlan {
  basePrice: number | string;
}

/**
 * Does checkout skip payment for this selection? True for a signed-in Operation
 * Team member choosing a plan that costs money (a free pair or $0 plan never
 * needed payment). Display only — the server decides from the live OP_TEAM role
 * when the migration is created, and refuses a request that claims otherwise.
 */
export function usePaymentSkipped(
  pairIsFree: boolean,
  plan: PricedPlan | null | undefined,
): boolean {
  const { isOperationTeam } = useOperationTeamMember();
  return (
    isOperationTeam && !pairIsFree && plan != null && Number(plan.basePrice) > 0
  );
}
