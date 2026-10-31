/** Roles that may enter the admin panel besides an admin-type token. What each can do is set by its permissions. */
const PANEL_ROLES = ['admin', 'developer'];

export const hasPanelRole = (roles?: string[]): boolean =>
  Array.isArray(roles) && roles.some((r) => PANEL_ROLES.includes(String(r).toLowerCase()));

/** Permission each admin section needs. Admins pass every check, so only restricted roles (e.g. Developer) see less. */
const PATH_PERMISSION: Record<string, string> = {
  '/admin': 'migration.read',
  '/admin/users': 'users.read',
  '/admin/users/create': 'users.write',
  '/admin/roles': 'roles.read',
  '/admin/permissions': 'permissions.read',
  '/admin/migrations': 'migration.read',
  '/admin/migration-pairs': 'migration-pair.read',
  '/admin/migration-reviews': 'migration-review.read',
  '/admin/error-logs': 'migration.read',
  '/admin/reports': 'migration.read',
  '/admin/tool-logos': 'banners.read',
  '/admin/plans': 'migration-pair.read',
  '/admin/audit': 'admin.read',
  '/admin/contacts': 'admin.read',
  '/admin/inquiries': 'admin.read',
  '/admin/faqs': 'faq.read',
  '/admin/settings': 'migration-cleaner.read',
  '/admin/faqs/new': 'faq.write',
};

/** The permission a page needs: the most specific matching section, or null for an unlisted path. */
export const permissionForPath = (pathname: string): string | null => {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (PATH_PERMISSION[path]) return PATH_PERMISSION[path];
  let best: string | null = null;
  for (const key of Object.keys(PATH_PERMISSION)) {
    if (key !== '/admin' && path.startsWith(key + '/') && (!best || key.length > best.length)) best = key;
  }
  return best ? PATH_PERMISSION[best] : null;
};
