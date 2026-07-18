import { useLocation } from 'react-router-dom';
import { scopeForPath, useSession, type AuthScope } from '@/store/authStore';

/** Which session the current route belongs to — admin panel vs public site. */
export function useAuthScope(): AuthScope {
  return scopeForPath(useLocation().pathname);
}

/** The session for the current route. */
export function useScopedSession() {
  return useSession(useAuthScope());
}
