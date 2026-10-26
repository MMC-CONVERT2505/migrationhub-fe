import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { usePageMeta } from '@/components/common/PageMeta';
import { NOT_FOUND_META } from '@/utils/routeMeta';

const NotFoundPage: React.FC = () => {
  usePageMeta(NOT_FOUND_META);
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-md text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Error 404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">Page not found</h1>
          <p className="mt-3 text-text-secondary">The page you were looking for doesn&rsquo;t exist or has moved.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Back to home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
