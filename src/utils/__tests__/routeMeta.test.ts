import { describe, expect, it } from 'vitest';
import { PUBLIC_PAGES, publicPage, routeMeta } from '../routeMeta';
import { SITE_URL, canonicalUrl } from '@/seo/site';
import { breadcrumbLd, faqLd, graph, organizationLd, softwareLd, websiteLd } from '@/seo/jsonLd';
import { FAQ_ITEMS } from '@/seo/faq';

describe('public pages', () => {
  it('lists the indexable pages, each with its own title and description', () => {
    expect(PUBLIC_PAGES.map((p) => p.path)).toEqual(['/', '/how-it-works', '/supported-platforms', '/about', '/contact', '/privacy', '/termsofuse']);
    expect(new Set(PUBLIC_PAGES.map((p) => p.title)).size).toBe(PUBLIC_PAGES.length);
    expect(new Set(PUBLIC_PAGES.map((p) => p.description)).size).toBe(PUBLIC_PAGES.length);
  });

  it('keeps titles and descriptions within search-result lengths', () => {
    for (const p of PUBLIC_PAGES) {
      expect(p.title.length).toBeGreaterThanOrEqual(40);
      expect(p.title.length).toBeLessThanOrEqual(64);
      expect(p.description.length).toBeGreaterThanOrEqual(150);
      expect(p.description.length).toBeLessThanOrEqual(160);
    }
  });

  it('uses the agreed homepage title', () => {
    expect(publicPage('/')?.title).toBe('MigrationHub | Accounting Data Migration Platform by MMC Convert');
  });

  it('matches a page with or without a trailing slash, and nothing else', () => {
    expect(publicPage('/about/')?.path).toBe('/about');
    expect(publicPage('/about/team')).toBeUndefined();
    expect(publicPage('/sign-in')).toBeUndefined();
  });

  it('never lists a private or app route as indexable', () => {
    for (const p of PUBLIC_PAGES) expect(p.path).not.toMatch(/^\/(admin|payment|migration|migrations|sign-in|sign-up|forgot-password|reset-password|change-password|api)(\/|$)/);
  });
});

describe('routeMeta', () => {
  it('keeps the wizard and admin out of search results', () => {
    expect(routeMeta('/migration/a-to-b/plan')?.noindex).toBe(true);
    expect(routeMeta('/admin/users')?.noindex).toBe(true);
    expect(routeMeta('/sign-in')?.noindex).toBe(true);
  });
  it('has no entry for unknown paths (they get the noindex default and the 404 page)', () => {
    expect(routeMeta('/no-such-page')).toBeNull();
  });
});

describe('canonicalUrl', () => {
  it('is absolute https, without query, hash or trailing slash (home keeps its slash)', () => {
    expect(canonicalUrl('/')).toBe(`${SITE_URL}/`);
    expect(canonicalUrl('/about/')).toBe(`${SITE_URL}/about`);
    expect(canonicalUrl('/contact?utm=x#form')).toBe(`${SITE_URL}/contact`);
    expect(canonicalUrl('privacy')).toBe(`${SITE_URL}/privacy`);
  });
});

describe('structured data', () => {
  it('describes the site, organisation and application without inventing ratings, prices or profiles', () => {
    const json = JSON.stringify(graph(websiteLd(), organizationLd(), softwareLd()));
    expect(json).toContain('"alternateName":["Migration Hub","MMC MigrationHub"]');
    expect(json).toContain('"applicationCategory":"BusinessApplication"');
    for (const banned of ['aggregateRating', 'ratingValue', 'reviewCount', '"offers"', '"price"', 'sameAs']) expect(json).not.toContain(banned);
  });
  it('builds a Home > page breadcrumb with absolute URLs', () => {
    const b = breadcrumbLd('/about', 'About') as { itemListElement: Array<{ position: number; item: string }> };
    expect(b.itemListElement.map((i) => i.item)).toEqual([`${SITE_URL}/`, `${SITE_URL}/about`]);
  });
  it('mirrors the visible FAQ exactly', () => {
    const f = faqLd(FAQ_ITEMS) as { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> };
    expect(f.mainEntity.map((q) => [q.name, q.acceptedAnswer.text])).toEqual(FAQ_ITEMS.map((i) => [i.q, i.a]));
  });
});
