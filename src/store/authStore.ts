import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '@/types/api';

export type AuthScope = 'user' | 'admin';

interface Session {
  accessToken: string | null;
  user: UserProfile | null;
}

interface AuthState {
  user: Session;
  admin: Session;
  setToken: (scope: AuthScope, token: string) => void;
  setUser: (scope: AuthScope, user: UserProfile) => void;
  logout: (scope: AuthScope) => void;
}

const emptySession: Session = { accessToken: null, user: null };

/**
 * The public site and the admin panel share one origin, so a single session
 * slot let an admin's token ride along on public requests — the API then read
 * an `admin` id where it expected a `user` id. Each scope keeps its own slot
 * and only the scope matching the current route is ever sent.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: emptySession,
      admin: emptySession,
      setToken: (scope, token) =>
        set((s) => ({ [scope]: { ...s[scope], accessToken: token } } as Pick<AuthState, AuthScope>)),
      setUser: (scope, user) =>
        set((s) => ({ [scope]: { ...s[scope], user } } as Pick<AuthState, AuthScope>)),
      logout: (scope) => set({ [scope]: emptySession } as Pick<AuthState, AuthScope>),
    }),
    {
      name: 'mmc-auth',
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
      // v1 held one ambiguous { accessToken, user }; file it under the scope its JWT claims.
      migrate: (persisted) => {
        const old = persisted as { accessToken?: string | null; user?: UserProfile | null };
        const session: Session = {
          accessToken: old?.accessToken ?? null,
          user: old?.user ?? null,
        };
        const scope: AuthScope =
          session.accessToken && decodeJwt(session.accessToken)?.type === 'admin'
            ? 'admin'
            : 'user';
        return { user: emptySession, admin: emptySession, [scope]: session };
      },
    },
  ),
);

interface JwtPayload {
  sub?: number;
  type?: string;
  roles?: string[];
  permissions?: string[];
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
  } catch {
    return null;
  }
}

/** `/admin` and below is the admin scope; everything else is the public site. */
export const scopeForPath = (pathname: string): AuthScope =>
  pathname === '/admin' || pathname.startsWith('/admin/') ? 'admin' : 'user';

export const currentScope = (): AuthScope => scopeForPath(window.location.pathname);

export const getSession = (scope: AuthScope): Session => useAuthStore.getState()[scope];

export const useSession = (scope: AuthScope): Session => useAuthStore((s) => s[scope]);

export const isAuthenticated = (scope: AuthScope = currentScope()): boolean =>
  !!getSession(scope).accessToken;
