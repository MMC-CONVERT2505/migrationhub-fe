import { matchPath } from 'react-router-dom';
import pages from '@/seo/pages.json';

export interface PageMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

export interface PublicPage extends PageMeta {
  path: string;
  name: string;
  source: string[];
}

/** Indexable pages: also the prerender and sitemap list (see scripts/). */
export const PUBLIC_PAGES: PublicPage[] = pages as PublicPage[];

const BRAND = 'MigrationHub | MMC Convert';

/** Known pages that must stay out of search results. Anything not listed here or in PUBLIC_PAGES is noindex too. */
const PRIVATE_ROUTES: Array<{ path: string; meta: PageMeta }> = [
  { path: '/sign-in', meta: { title: `Sign in | ${BRAND}`, description: 'Sign in to MigrationHub to start or track your accounting data migration.', noindex: true } },
  { path: '/migration/:pairSlug/plan', meta: { title: `Choose your plan | ${BRAND}`, description: 'Choose the plan for your accounting data migration.', noindex: true } },
  { path: '/admin/*', meta: { title: `Admin | ${BRAND}`, description: 'MigrationHub administration.', noindex: true } },
];

/** Fallback for every other route (wizard steps, payment, sign-up, tracking, unknown URLs). */
export const PRIVATE_DEFAULT_META: PageMeta = {
  title: `${BRAND}`,
  description: 'MigrationHub by MMC Convert.',
  noindex: true,
};

export const NOT_FOUND_META: PageMeta = {
  title: `Page not found | ${BRAND}`,
  description: 'The page you were looking for does not exist.',
  noindex: true,
};

const normalise = (pathname: string): string => {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
};

export const publicPage = (pathname: string): PublicPage | undefined => PUBLIC_PAGES.find((p) => p.path === normalise(pathname));

/** The page's metadata, or null for routes that have none of their own. */
export function routeMeta(pathname: string): PageMeta | null {
  const pub = publicPage(pathname);
  if (pub) return pub;
  const hit = PRIVATE_ROUTES.find((r) => matchPath({ path: r.path, end: true }, pathname));
  return hit ? hit.meta : null;
}
