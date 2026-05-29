import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

const PREVIEW_ITEMS = [
  { label: 'Chart of accounts', records: '180', done: true },
  { label: 'Contacts & customers', records: '1,240', done: true },
  { label: 'Invoices & sales', records: '2,100', progress: 68 },
  { label: 'Bank transactions', records: '3,400', progress: 0 },
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-16 pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-light border border-blue-200 rounded-full px-3 py-1.5 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-blue-700">81 migrations running live right now</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight tracking-tight">
              Migrate your{' '}
              <span className="text-blue-600">accounting data</span>{' '}
              without the headache
            </h1>

            <p className="mt-6 text-lg text-text-secondary leading-relaxed max-w-xl">
              Enterprise-grade migration between QuickBooks, Xero, MYOB, FreshBooks, Tally, ZOHO and more.
              Accurate, auditable, and done in under 30 minutes.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/payment')}
                iconRight={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                }
              >
                Start your migration
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  document.getElementById('pairs')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View all migrations
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-6">
              <div className="flex -space-x-2">
                {['#2563eb', '#16a34a', '#ea580c', '#9b1c1c'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-text-tertiary mt-0.5">Rated 4.9/5 by 600+ accountants</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="lg:block"
          >
            <div className="bg-white rounded-2xl border border-border shadow-elevated p-6 relative">
              {/* Card header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-[#13B5EA] flex items-center justify-center text-white font-bold font-mono text-sm">
                      XE
                    </div>
                    <svg className="w-5 h-5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="w-10 h-10 rounded-lg bg-[#2CA01C] flex items-center justify-center text-white font-bold font-mono text-sm">
                      QB
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Xero → QuickBooks</p>
                    <p className="text-xs text-text-tertiary">Bright & Co. Pty Ltd</p>
                  </div>
                </div>
                <Badge variant="info">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                  Running
                </Badge>
              </div>

              {/* Progress items */}
              <div className="space-y-3">
                {PREVIEW_ITEMS.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {item.done ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : item.progress !== undefined && item.progress > 0 ? (
                          <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border" />
                        )}
                        <span className={`text-sm ${item.done ? 'text-text-secondary' : item.progress !== undefined && item.progress > 0 ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xs text-text-tertiary font-mono">{item.records}</span>
                    </div>
                    {!item.done && (
                      <div className="h-1.5 bg-bg-lighter rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${item.progress !== undefined && item.progress > 0 ? 'bg-blue-500' : 'bg-transparent'}`}
                          style={{ width: `${item.progress ?? 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-tertiary">Overall progress</p>
                  <p className="text-sm font-semibold text-text-primary">68% complete</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-tertiary">Est. time remaining</p>
                  <p className="text-sm font-semibold text-text-primary font-mono">~7 min</p>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
