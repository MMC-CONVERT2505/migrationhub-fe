import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { FAQ_ITEMS } from '@/seo/faq';

// TODO(confirm): each step below against the live flow (plan, details, payment, connect, tracking, report).
const STEPS = [
  {
    title: 'Choose your migration',
    body: 'Pick the platform you are moving from and the one you are moving to. MigrationHub lists every migration it offers, grouped by source platform.',
  },
  {
    title: 'Select your plan and country',
    body: 'Choose the country your business is registered in to see prices in your currency. Some migrations are free in certain countries, and the price is always shown before you pay.',
  },
  {
    title: 'Enter your business details',
    body: 'Tell us who you are, the name of the entity to migrate and its financial year end, so the migration covers the right years.',
  },
  {
    title: 'Pay securely, or start for free',
    body: 'Paid migrations are charged through our payment provider, Razorpay. Free migrations skip payment and go straight to the next step.',
  },
  {
    title: 'Connect your accounts',
    body: 'In the migration tool you authorise access to your source and destination accounts, then confirm what to move.',
  },
  {
    title: 'Track progress and review the result',
    body: 'Follow your migration on its progress page. Every migration includes a reconciliation report so you can check the result against your source.',
  },
];

const HowItWorksPage: React.FC = () => (
  <div className="min-h-screen bg-bg">
    <Navbar />
    <main>
      <Breadcrumbs />
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
            How MigrationHub <span className="text-blue-600">works</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-text-secondary">
            MigrationHub, from MMC Convert, moves your accounting data from one platform to another in six clear steps. You see the price before you pay, and your source data stays untouched.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">The migration, step by step</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-text-secondary">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Frequently asked questions</h2>
          <dl className="mt-8 space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-text-primary">{item.q}</dt>
                <dd className="mt-1 leading-relaxed text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap gap-4 text-sm font-semibold">
            <Link to={{ pathname: '/', hash: '#pairs' }} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              Start a migration
            </Link>
            <Link to="/supported-platforms" className="px-2 py-2.5 text-blue-700 hover:underline">See supported platforms</Link>
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default HowItWorksPage;
