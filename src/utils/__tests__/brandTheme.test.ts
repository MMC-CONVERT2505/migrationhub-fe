import { describe, expect, it } from 'vitest';
import { isAdminPath } from '../brandTheme';

describe('isAdminPath', () => {
  it('is true for the admin panel only', () => {
    for (const p of ['/admin', '/admin/', '/admin/users', '/admin/login']) expect(isAdminPath(p)).toBe(true);
    for (const p of ['/', '/administrator', '/adminx', '/migrations', '/privacy']) expect(isAdminPath(p)).toBe(false);
  });
});
