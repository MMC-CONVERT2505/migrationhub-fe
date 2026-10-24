import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** Marks the history entries this guard added, so re-mounting never stacks extra ones. */
const TRAP_STATE = { dedicatedTrap: true };

/**
 * Holds the person on this page when they press the browser's Back or Forward button — used only inside the
 * website direct-link flow, which must never lead back to the Hub home page or the plan page.
 *
 * On arrival it puts one harmless entry of this same page behind the current one, so the first Back has somewhere to
 * land. Whenever a Back/Forward lands here again it pushes the page afresh, which also discards any Forward entries.
 * Leaving the page (submitting, finishing) removes the listener, so nothing is trapped afterwards.
 *
 * Browsers may skip entries a page added before the visitor interacted with it; the flow lock (home, other pairs and
 * the plan page all resolve back to customer-details) is the second layer for that case.
 */
export function useDedicatedBackTrap(active: boolean): void {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!active) return;
    const here = `${pathname}${search}`;

    if (!(window.history.state?.usr as { dedicatedTrap?: boolean } | null)?.dedicatedTrap) {
      navigate(here, { replace: true, state: TRAP_STATE });
      navigate(here, { state: TRAP_STATE });
    }

    const onPop = () => navigate(here, { state: TRAP_STATE });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // `here` is fixed for this page's lifetime; re-arm only when the guard turns on/off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
