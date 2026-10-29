import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { breadcrumbLd, faqLd, graph, organizationLd, softwareLd, websiteLd } from '@/seo/jsonLd';
import { FAQ_ITEMS } from '@/seo/faq';
import { OG_IMAGE, OG_IMAGE_ALT, SITE_NAME, canonicalUrl } from '@/seo/site';
import { NOT_FOUND_META, PRIVATE_DEFAULT_META, publicPage, routeMeta, type PageMeta } from '@/utils/routeMeta';

export interface SEOProps {
  title: string;
  description: string;
  /** Route path the canonical URL is built from. Required for indexable pages. */
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown>;
}

const INDEX = 'index, follow, max-image-preview:large';
const NOINDEX = 'noindex, nofollow';

/** Title, description, canonical, robots, Open Graph, Twitter card and JSON-LD for one page. */
export const SEO: React.FC<SEOProps> = ({ title, description, path, image = OG_IMAGE, noindex = false, type = 'website', jsonLd }) => {
  const url = path !== undefined ? canonicalUrl(path) : undefined;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? NOINDEX : INDEX} />
      {!noindex && url && <link rel="canonical" href={url} />}
      {!noindex && (
        <meta property="og:type" content={type} />
      )}
      {!noindex && <meta property="og:site_name" content={SITE_NAME} />}
      {!noindex && <meta property="og:title" content={title} />}
      {!noindex && <meta property="og:description" content={description} />}
      {!noindex && url && <meta property="og:url" content={url} />}
      {!noindex && <meta property="og:image" content={image} />}
      {!noindex && <meta property="og:image:width" content="1200" />}
      {!noindex && <meta property="og:image:height" content="630" />}
      {!noindex && <meta property="og:image:alt" content={OG_IMAGE_ALT} />}
      {!noindex && <meta property="og:locale" content="en" />}
      {!noindex && <meta name="twitter:card" content="summary_large_image" />}
      {!noindex && <meta name="twitter:title" content={title} />}
      {!noindex && <meta name="twitter:description" content={description} />}
      {!noindex && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

/** Search-console verification tags, from env at build time. Home page only; no secrets (these are public tokens). */
const GSC = import.meta.env.VITE_GSC_VERIFICATION as string | undefined;
const BING = import.meta.env.VITE_BING_VERIFICATION as string | undefined;
const Verification: React.FC = () => (
  <Helmet>
    {GSC && <meta name="google-site-verification" content={GSC} />}
    {BING && <meta name="msvalidate.01" content={BING} />}
  </Helmet>
);

function jsonLdFor(path: string, name: string): Record<string, unknown> {
  if (path === '/') return graph(websiteLd(), organizationLd(), softwareLd());
  if (path === '/how-it-works') return graph(breadcrumbLd(path, name), faqLd(FAQ_ITEMS));
  return graph(breadcrumbLd(path, name));
}

/** Applies the right SEO tags for the current route. Public pages are indexable; every other route is noindex. */
export const RouteSEO: React.FC = () => {
  const { pathname } = useLocation();
  const pub = publicPage(pathname);
  if (pub) {
    return (
      <>
        <SEO title={pub.title} description={pub.description} path={pub.path} jsonLd={jsonLdFor(pub.path, pub.name)} />
        {pub.path === '/' && <Verification />}
      </>
    );
  }
  const meta: PageMeta = routeMeta(pathname) ?? PRIVATE_DEFAULT_META;
  return <SEO title={meta.title} description={meta.description} noindex />;
};

export const NotFoundSEO: React.FC = () => <SEO {...NOT_FOUND_META} noindex />;
