import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { routeMeta, type PageMeta } from '@/utils/routeMeta';

function setMeta(name: string, content: string | null): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (content === null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Applies a page's title and description (and noindex) while mounted; the previous values return on unmount. */
export function usePageMeta(meta: PageMeta | null): void {
  const { title, description, noindex } = meta ?? { title: '', description: '', noindex: false };
  const active = meta !== null;
  useEffect(() => {
    if (!active) return;
    const prevTitle = document.title;
    const prevDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null;
    const prevRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? null;
    document.title = title;
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex' : prevRobots);
    return () => {
      document.title = prevTitle;
      setMeta('description', prevDesc);
      setMeta('robots', prevRobots);
    };
  }, [active, title, description, noindex]);
}

/** Per-route metadata for the pages listed in utils/routeMeta. */
export const RouteMeta: React.FC = () => {
  const { pathname } = useLocation();
  usePageMeta(routeMeta(pathname));
  return null;
};
