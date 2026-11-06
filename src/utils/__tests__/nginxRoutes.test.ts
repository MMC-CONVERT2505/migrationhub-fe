import { describe, expect, it } from 'vitest';

const raw = (glob: Record<string, string>) => Object.values(glob)[0];
const nginx = raw(import.meta.glob('/nginx.conf', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
const headers = raw(import.meta.glob('/security-headers.conf', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
const pages = (Object.values(import.meta.glob('/src/seo/pages.json', { eager: true, import: 'default' }))[0] as Array<{ path: string }>).map((p) => p.path);
const app = raw(import.meta.glob('/src/App.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);

describe('nginx SPA route list', () => {
  const listed = new Set(
    (nginx.match(/~\^\/\(([^)]+)\)\(\/\|\$\)/)?.[1] ?? '').split('|'),
  );
  const routed = new Set(
    [...app.matchAll(/<Route path="\/([a-z-]+)/g)].map((m) => m[1]),
  );

  it('lists every first path segment the router serves', () => {
    expect([...routed].filter((seg) => !listed.has(seg))).toEqual([]);
  });

  it('serves robots.txt and sitemap.xml as files and sends security headers', () => {
    expect(nginx).toContain('location = /robots.txt');
    expect(nginx).toContain('location = /sitemap.xml');
    for (const h of ['Strict-Transport-Security', 'Content-Security-Policy-Report-Only', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Robots-Tag']) {
      expect(headers).toContain(h);
    }
  });

  it('includes the shared headers in every location that sets its own add_header (nginx drops inherited ones there)', () => {
    const locations = nginx.split(/\n    location /).slice(1).filter((l) => /add_header/.test(l));
    expect(locations.length).toBeGreaterThan(3);
    for (const l of locations) expect(l).toContain('include /etc/nginx/security-headers.conf');
  });

  it('serves every public page from its prerendered file, and no private area as indexable', () => {
    const listed = nginx.match(/\(\?<page>([^)]+)\)\$ \{/)?.[1].split('|') ?? [];
    expect(listed.sort()).toEqual(pages.filter((p) => p !== '/').map((p) => p.slice(1)).sort());
    expect(nginx).toContain('try_files /home.html /index.html');
    for (const area of ['api', 'admin', 'payment', 'migration', 'sign-in']) expect(nginx).toMatch(new RegExp(`"~\\^\\\\d\\+ /\\([^)]*\\b${area}\\b`));
    expect(nginx).toContain('"~^404 "');
  });
});
