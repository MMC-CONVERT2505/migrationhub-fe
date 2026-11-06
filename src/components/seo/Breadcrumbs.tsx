import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { publicPage } from '@/utils/routeMeta';

/** Home › Page. Mirrors the BreadcrumbList JSON-LD that RouteSEO emits for the same page. */
export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const page = publicPage(pathname);
  if (!page || page.path === '/') return null;
  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <ol className="flex items-center gap-2 text-sm text-text-secondary">
        <li>
          <Link to="/" className="font-medium text-blue-700 hover:underline">Home</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="text-text-primary">{page.name}</li>
      </ol>
    </nav>
  );
};
