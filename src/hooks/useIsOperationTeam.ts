import { decodeJwt, useSession } from '@/store/authStore';

export const OP_TEAM_ROLE = 'OP_TEAM';

/** Role names from either shape the API has used: ['A'] or [{ role: { name: 'A' } }]. */
function roleNames(roles: unknown): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => (typeof r === 'string' ? r : (r as { role?: { name?: string } })?.role?.name))
    .filter((r): r is string => !!r);
}

/**
 * Is the signed-in public-site user an Operation Team member?
 * Reads the live profile roles (refreshed from /users/me) and falls back to the
 * token's claims before the profile has loaded. Display only: the server
 * re-checks the role from the database on every migration it records.
 */
export function useOperationTeamMember(): { isOperationTeam: boolean; name: string | null } {
  const { accessToken, user } = useSession('user');
  if (!accessToken) return { isOperationTeam: false, name: null };

  const roles = user?.roles !== undefined ? roleNames(user.roles) : roleNames(decodeJwt(accessToken)?.roles);
  const isOperationTeam = roles.includes(OP_TEAM_ROLE);
  const name = user ? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || user.email || null : null;
  return { isOperationTeam, name };
}
