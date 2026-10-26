import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const POLL_MS = 100;
const GIVE_UP_MS = 4000;
const SETTLE_MS = 2000;

/**
 * Pages are lazy-loaded and their sections grow as data arrives, so the browser's own jump to /#section lands
 * on nothing. Wait for the target to exist, scroll to it, then keep it aligned while the page settles. Any
 * wheel, touch or key press from the visitor ends it.
 */
export function useHashScroll(pathname: string, hash: string): void {
  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    if (!id) return;

    const started = Date.now();
    let foundAt = 0;
    let stopped = false;
    const stop = () => { stopped = true; };
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));

    const tick = () => {
      if (stopped) return;
      const el = document.getElementById(id);
      const now = Date.now();
      if (el) {
        if (!foundAt) foundAt = now;
        el.scrollIntoView({ block: 'start' });
        if (now - foundAt >= SETTLE_MS) return;
      } else if (now - started >= GIVE_UP_MS) {
        return;
      }
      timer = window.setTimeout(tick, POLL_MS);
    };
    let timer = window.setTimeout(tick, 0);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname, hash]);
}

export const HashScroll: React.FC = () => {
  const { pathname, hash } = useLocation();
  useHashScroll(pathname, hash);
  return null;
};
