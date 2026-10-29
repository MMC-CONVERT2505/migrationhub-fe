import { BRAND, LOGO_URL, ORG_NAME, ORG_URL, SAME_AS, SITE_URL, canonicalUrl } from './site';

type Json = Record<string, unknown>;

const ORG_ID = `${ORG_URL}/#organization`;

export const organizationLd = (): Json => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: ORG_NAME,
  url: ORG_URL,
  logo: LOGO_URL,
  ...(SAME_AS.length > 0 ? { sameAs: SAME_AS } : {}),
});

export const websiteLd = (): Json => ({
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: BRAND,
  alternateName: ['Migration Hub', 'MMC MigrationHub'],
  url: `${SITE_URL}/`,
  publisher: { '@id': ORG_ID },
});

export const softwareLd = (): Json => ({
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#software`,
  name: BRAND,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${SITE_URL}/`,
  publisher: { '@id': ORG_ID },
});

/** Home → this page. Only for inner pages. */
export const breadcrumbLd = (path: string, name: string): Json => ({
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
    { '@type': 'ListItem', position: 2, name, item: canonicalUrl(path) },
  ],
});

export const faqLd = (items: Array<{ q: string; a: string }>): Json => ({
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

export const graph = (...nodes: Json[]): Json => ({ '@context': 'https://schema.org', '@graph': nodes });
