import { describe, expect, it } from 'vitest';
import { hasPanelRole, permissionForPath } from '../adminAccess';

describe('hasPanelRole', () => {
  it('lets admin and developer roles in, ignoring case', () => {
    expect(hasPanelRole(['admin'])).toBe(true);
    expect(hasPanelRole(['DEVELOPER'])).toBe(true);
    expect(hasPanelRole(['USER', 'Developer'])).toBe(true);
  });
  it('keeps everyone else out, including missing roles', () => {
    expect(hasPanelRole([])).toBe(false);
    expect(hasPanelRole(['OP_TEAM', 'USER'])).toBe(false);
    expect(hasPanelRole(undefined)).toBe(false);
  });
});

describe('permissionForPath', () => {
  it('maps sections and their sub-pages to the permission they need', () => {
    expect(permissionForPath('/admin')).toBe('migration.read');
    expect(permissionForPath('/admin/migrations')).toBe('migration.read');
    expect(permissionForPath('/admin/migrations/abc123')).toBe('migration.read');
    expect(permissionForPath('/admin/migrations/')).toBe('migration.read');
    expect(permissionForPath('/admin/users')).toBe('users.read');
    expect(permissionForPath('/admin/faqs/7')).toBe('faq.read');
  });
  it('asks for write on pages that create things', () => {
    expect(permissionForPath('/admin/users/create')).toBe('users.write');
    expect(permissionForPath('/admin/faqs/new')).toBe('faq.write');
  });
  it('does not guess for paths it does not know', () => {
    expect(permissionForPath('/admin/nothing-here')).toBeNull();
    expect(permissionForPath('/somewhere/else')).toBeNull();
  });
});
