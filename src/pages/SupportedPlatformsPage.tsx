import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PLATFORM_GROUPS } from '@/seo/platforms';

const SupportedPlatformsPage: React.FC = () => (
  <div className="min-h-screen bg-bg">
    <Navbar />
    <main>
      <Breadcrumbs />
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Accounting platforms <span className="text-blue-600">MigrationHub</span> supports
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            MigrationHub by MMC Convert offers these accounting data migrations today. Each one moves your data from the source platform to the destination, and you see the price for your country before you pay.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Migrations by source platform</h2>
          <div className="mt-8 space-y-8">
            {PLATFORM_GROUPS.map((group) => (
              <div key={group.source}>
                <h3 className="text-lg font-semibold text-text-primary">From {group.source}</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {group.destinations.map((dest) => (
                    <li key={dest} className="rounded-lg border border-border bg-bg-light px-4 py-3 text-text-secondary">
                      <span className="font-medium text-text-primary">{group.source}</span> to <span className="font-medium text-text-primary">{dest}</span> migration
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Don&rsquo;t see your platform?</h2>
          <p className="mt-3 leading-relaxed text-text-secondary">
            Tell the MMC Convert team which platforms you are moving between and we will tell you what is possible.
          </p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to={{ pathname: '/', hash: '#pairs' }} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Start a migration
            </Link>
            <Link to="/contact" className="px-2 py-2.5 text-blue-700 hover:underline">Contact the MMC Convert team</Link>
            <Link to="/how-it-works" className="px-2 py-2.5 text-blue-700 hover:underline">How MigrationHub works</Link>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default SupportedPlatformsPage;
