/** The admin panel keeps the original palette; everything else uses the MMC Convert brand palette. */
export const isAdminPath = (pathname: string): boolean => pathname === '/admin' || pathname.startsWith('/admin/');
