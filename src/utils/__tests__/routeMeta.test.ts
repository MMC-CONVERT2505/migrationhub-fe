import { describe, expect, it } from 'vitest';
import { routeMeta } from '../routeMeta';

describe('routeMeta', () => {
  it.each(['/', '/about', '/contact', '/sign-in', '/privacy', '/termsofuse', '/migration/xero-to-qbo/plan'])(
    '%s has its own title and description',
    (path) => {
      const m = routeMeta(path);
      expect(m?.title).toBeTruthy();
      expect(m?.description).toBeTruthy();
    },
  );

  it('gives each public page a distinct title', () => {
    const titles = ['/', '/about', '/contact', '/sign-in', '/privacy', '/termsofuse'].map((p) => routeMeta(p)!.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('leaves unknown paths to the 404 page', () => {
    expect(routeMeta('/no-such-page')).toBeNull();
  });

  it('keeps the wizard and admin out of search results', () => {
    expect(routeMeta('/migration/a-to-b/plan')?.noindex).toBe(true);
    expect(routeMeta('/admin/users')?.noindex).toBe(true);
  });
});
