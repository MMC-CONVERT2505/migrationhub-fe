import { OP_TEAM_ROLE, roleNames } from '@/hooks/useIsOperationTeam';

/**
 * The sign-in token claims Operation Team, but the server (which reads the role fresh from the database) says the
 * person does not hold it any more. The form would keep treating them as the team while the server treats them as a
 * customer. `liveRoles` that is not a list means "not known": never act on that.
 */
export function operatorClaimIsStale(tokenRoles: unknown, liveRoles: unknown): boolean {
  if (!Array.isArray(liveRoles)) return false;
  return roleNames(tokenRoles).includes(OP_TEAM_ROLE) && !roleNames(liveRoles).includes(OP_TEAM_ROLE);
}

/** The server accepted the request as a customer or guest: it asks for the phone that the Operation Team never gives. */
export function isPhoneRequiredRejection(statusCode: number | undefined, message: string | undefined): boolean {
  return statusCode === 400 && /phone number is required/i.test(message ?? '');
}
