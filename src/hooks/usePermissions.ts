import { useCallback, useMemo } from 'react';
import { useSession } from '@/store/authStore';

interface JwtPayload {
  sub: number;
  type?: string;
  permissions?: string[];
  roles?: string[];
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
  } catch {
    return null;
  }
}

export function usePermissions() {
  const token = useSession('admin').accessToken;

  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  /**
   * Super-admin when:
   *  • JWT type is "admin"
   *  • OR the JWT payload has no "permissions" key at all
   *
   * In both cases we grant every can() call so no admin action is ever hidden.
   */
  const isSuperAdmin = useMemo(() => {
    if (!payload) return false;
    if (payload.type === 'admin') return true;
    return !('permissions' in payload);
  }, [payload]);

  const permissions = useMemo<string[]>(
    () => (Array.isArray(payload?.permissions) ? payload!.permissions! : []),
    [payload],
  );

  const can = useCallback(
    (permission: string) => isSuperAdmin || permissions.includes(permission),
    [isSuperAdmin, permissions],
  );

  // A real admin account (not a role that happens to carry every permission): some actions are theirs alone.
  const isAdminAccount = payload?.type === 'admin';

  return { can, permissions, roles: payload?.roles ?? [], isSuperAdmin, isAdminAccount };
}
