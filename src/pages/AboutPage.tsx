import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/common/Button';
import { visibleStats, type TrustMetricKey } from '@/content/trustMetrics';
import { useCatalogueCounts } from '@/hooks/useAvailablePairs';

const STAT_ITEMS: Array<{ key: TrustMetricKey; label: string }> = [
  { key: 'migrationsCompleted', label: 'Migrations completed' },
  { key: 'dataAccuracy', label: 'Data accuracy' },
  { key: 'averageMigrationTime', label: 'Average migration time' },
];

const VALUES = [
  {
    title: 'Accuracy first',
    body: 'Every record is mapped, validated, and reconciled. A migration you can audit line by line — not a best-effort import.',
    path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Secure by design',
    body: '256-bit SSL in transit and encrypted credentials. Your data is used only to run your migration and is deleted after your support window.',
    path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'Built for speed',
    body: 'Purpose-built connectors move years of history in minutes, so you spend less time waiting and more time on your books.',
    path: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'People behind it',
    body: 'Accountants and engineers in equal measure. When something looks off, a human who understands the ledger is on it.',
    path: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z',
  },
];

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const counts = useCatalogueCounts();
  // Platforms come from the catalogue; hidden until it loads (or if it cannot).
  const stats = [
    ...visibleStats(STAT_ITEMS.slice(0, 1)),
    ...(counts ? [{ value: String(counts.platforms), label: 'Accounting platforms' }] : []),
    ...visibleStats(STAT_ITEMS.slice(1)),
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main>
        <Breadcrumbs />
        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 bg-blue-light border border-blue-200 rounded-full px-3 py-1.5 mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-xs font-medium text-blue-700">About MMC Convert</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
                Accounting migrations,{' '}
                <span className="text-blue-600">done right</span>
              </h1>

              <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-xl">
                MMC Convert moves accounting data between platforms like QuickBooks, Xero, MYOB,
                FreshBooks, Tally and ZOHO — accurately, securely, and fast. We exist so that
                switching tools never means losing your history.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        {stats.length > 0 && <section className="py-12 border-y border-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-x-16 gap-y-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-text-primary">{stat.value}</div>
                  <div className="mt-1 text-sm text-text-tertiary">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>}

        {/* Mission */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Our mission</h2>
            <p className="mt-5 text-lg text-text-secondary leading-relaxed">
              Migrating financial data has always been painful — slow exports, broken mappings, and
              numbers that don&apos;t reconcile. We started MMC Convert to make it boringly reliable:
              an enterprise-grade migration that any accountant can trust and any auditor can verify.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="bg-white border border-border rounded-2xl p-6 hover:border-border-medium transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-light flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={value.path} />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary">{value.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">{value.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-600 rounded-2xl px-6 py-12 sm:px-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to migrate?</h2>
              <p className="mt-3 text-blue-100 max-w-xl mx-auto">
                Start your migration in minutes — or talk to us first. Either way, your data is in safe hands.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="secondary" size="lg" onClick={() => navigate('/home')}>
                  Start a migration
                </Button> 
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
