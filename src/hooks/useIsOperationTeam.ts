import { useEffect } from 'react';
import { decodeJwt, useAuthStore, useSession } from '@/store/authStore';
import { usersService } from '@/api/users';

export const OP_TEAM_ROLE = 'OP_TEAM';

/** Role names from either shape the API has used: ['A'] or [{ role: { name: 'A' } }]. */
export function roleNames(roles: unknown): string[] {
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
// One refresh at a time per token, however many components ask.
let refreshing: string | null = null;

export function useOperationTeamMember(): { isOperationTeam: boolean; name: string | null } {
  const { accessToken, user } = useSession('user');
  const setUser = useAuthStore((s) => s.setUser);

  // A session saved before roles were stored has a token but no roles on the profile: fetch them once,
  // so a signed-in Operation Team member is never treated as a customer because of a stale session.
  const needsRoles = !!accessToken && user?.roles === undefined;
  useEffect(() => {
    if (!needsRoles || !accessToken || refreshing === accessToken) return;
    refreshing = accessToken;
    usersService
      .getMe()
      .then((res) => setUser('user', res.data))
      .catch(() => { refreshing = null; });
  }, [needsRoles, accessToken, setUser]);

  if (!accessToken) return { isOperationTeam: false, name: null };

  // Either source is enough: a cached profile can be older than the token (or the reverse).
  const roles = [...roleNames(user?.roles), ...roleNames(decodeJwt(accessToken)?.roles)];
  const isOperationTeam = roles.includes(OP_TEAM_ROLE);
  const name = user ? `${user.firstname ?? ''} ${user.lastname ?? ''}`.trim() || user.email || null : null;
  return { isOperationTeam, name };
}
