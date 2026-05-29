import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';

const SAFETY_FEATURES = [
  {
    icon: '🔄',
    title: 'Free revisions',
    description: 'Up to 5 revisions on Standard, unlimited on Enterprise. We get it right.',
  },
  {
    icon: '📊',
    title: 'Reconciliation report',
    description: 'Every migration ships with a detailed reconciliation report for full audit confidence.',
  },
  {
    icon: '📞',
    title: 'Post-migration support',
    description: '30-day support window after migration. Phone, chat, and email included on Enterprise.',
  },
  {
    icon: '🛡️',
    title: 'Data backup',
    description: 'Your source data is backed up before migration begins. We never delete originals.',
  },
];

export const SafetyNet: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Left: Text */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 lg:p-12"
            >
              <div className="inline-flex items-center gap-2 bg-green-light border border-green-200 rounded-full px-3 py-1 mb-6">
                <span className="text-green-700 text-xs font-semibold">🛡️ Safety Net Guarantee</span>
              </div>
              <h2 className="text-3xl font-bold text-text-primary leading-tight">
                We stand behind every migration
              </h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Unlike file import tools, MMC Convert provides human oversight at every step.
                Our migration specialists review data mappings before transfer and are available
                throughout the process.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SAFETY_FEATURES.map((feature) => (
                  <div key={feature.title} className="flex gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{feature.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{feature.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
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
              </div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-bg-lighter p-8 lg:p-12 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-border"
            >
              <div className="space-y-4 w-full max-w-xs">
                {/* Migration check steps */}
                {[
                  { step: 'Data backup created', done: true },
                  { step: 'Mapping reviewed by specialist', done: true },
                  { step: 'Records transferred', done: true },
                  { step: 'Reconciliation report generated', done: true },
                  { step: '30-day support window active', active: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      item.done
                        ? 'bg-green-500 border-green-500'
                        : item.active
                        ? 'bg-blue-600 border-blue-600 animate-pulse'
                        : 'border-border bg-white'
                    }`}>
                      {(item.done || item.active) && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${item.done || item.active ? 'text-text-primary font-medium' : 'text-text-tertiary'}`}>
                      {item.step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
