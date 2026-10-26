import { matchPath } from 'react-router-dom';

export interface PageMeta {
  title: string;
  description: string;
  noindex?: boolean;
}

const BRAND = 'Migration Hub | MMC Convert';

/** Titles and descriptions for the public pages; no figures or claims that need an owner's sign-off. */
const ROUTES: Array<{ path: string; end?: boolean; meta: PageMeta }> = [
  {
    path: '/',
    meta: {
      title: 'Migration Hub — Powered by MMC Convert',
      description: 'Move your accounting data between QuickBooks Online, Xero, MYOB, FreshBooks, Tally, ZOHO and more with MMC Convert.',
    },
  },
  {
    path: '/about',
    meta: { title: `About | ${BRAND}`, description: 'About Migration Hub and the MMC Convert team behind it.' },
  },
  {
    path: '/contact',
    meta: { title: `Contact us | ${BRAND}`, description: 'Contact the MMC Convert team about an accounting data migration.' },
  },
  {
    path: '/sign-in',
    meta: { title: `Sign in | ${BRAND}`, description: 'Sign in to Migration Hub to start or track your accounting data migration.' },
  },
  {
    path: '/privacy',
    meta: { title: `Privacy Policy | ${BRAND}`, description: 'How Migration Hub collects, uses and protects your information.' },
  },
  {
    path: '/termsofuse',
    meta: { title: `Terms of Use | ${BRAND}`, description: 'The terms that apply when you use Migration Hub.' },
  },
  {
    path: '/migration/:pairSlug/plan',
    meta: {
      title: `Choose your plan | ${BRAND}`,
      description: 'Choose the plan for your accounting data migration.',
      noindex: true,
    },
  },
  {
    path: '/admin/*',
    meta: { title: `Admin | ${BRAND}`, description: 'Migration Hub administration.', noindex: true },
  },
];

export const NOT_FOUND_META: PageMeta = {
  title: `Page not found | ${BRAND}`,
  description: 'The page you were looking for does not exist.',
  noindex: true,
};

/** The page's metadata, or null for routes that keep the document defaults. */
export function routeMeta(pathname: string): PageMeta | null {
  const hit = ROUTES.find((r) => matchPath({ path: r.path, end: true }, pathname));
  return hit ? hit.meta : null;
}
