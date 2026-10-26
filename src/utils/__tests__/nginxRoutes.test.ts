import { describe, expect, it } from 'vitest';

const raw = (glob: Record<string, string>) => Object.values(glob)[0];
const nginx = raw(import.meta.glob('/nginx.conf', { query: '?raw', import: 'default', eager: true }) as Record<string, string>);
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
    for (const h of ['Strict-Transport-Security', 'Content-Security-Policy-Report-Only', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      expect(nginx).toContain(h);
    }
  });
});
