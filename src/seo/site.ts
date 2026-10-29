/** Facts about the site that every SEO output (meta, JSON-LD, sitemap) shares. */
export const SITE_URL = 'https://migrationhub.mmcconvert.com';
export const SITE_NAME = 'MigrationHub by MMC Convert';
export const BRAND = 'MigrationHub';
export const ORG_NAME = 'MMC Convert';
export const ORG_URL = 'https://www.mmcconvert.com';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;
export const OG_IMAGE_ALT = 'MigrationHub by MMC Convert: accounting data migration platform';
export const LOGO_URL = `${SITE_URL}/icon-512.png`; // TODO(confirm): swap for the official MMC Convert logo file

/** Official profiles for Organization.sameAs; none are published until a real URL is added.
 *  TODO(owner): LinkedIn, Crunchbase, G2 and other official profile URLs. */
export const SAME_AS: string[] = [];

/** Absolute canonical URL for a route: no query string, no trailing slash except the home page. */
export function canonicalUrl(path: string): string {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '');
  return clean === '' ? `${SITE_URL}/` : `${SITE_URL}${clean.startsWith('/') ? clean : `/${clean}`}`;
}
