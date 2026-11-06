import React from 'react';
import { motion } from 'framer-motion';
import { TRUST_METRICS } from '@/content/trustMetrics';

const WHY_CARDS = [
  {
    icon: '🔒',
    title: 'Enterprise security',
    description: '256-bit SSL encryption in transit, and your data is deleted after your support window. See our Privacy Policy for the detail.',
  },
  {
    icon: '⚡',
    title: 'Fast & reliable',
    description: [
      TRUST_METRICS.averageMigrationTime ? `Average migration time of ${TRUST_METRICS.averageMigrationTime}.` : null,
      `Our optimised engine handles millions of records${TRUST_METRICS.dataAccuracy ? ` with ${TRUST_METRICS.dataAccuracy} accuracy` : ''}.`,
    ].filter(Boolean).join(' '),
  },
  {
    icon: '🧑‍💼',
    title: 'Expert support',
    description: 'Dedicated migration specialists available 24/7. Every migration includes a reconciliation report.',
  },
  {
    icon: '🔄',
    title: 'Full data fidelity',
    description: 'We migrate everything — invoices, bills, bank transactions, payroll, contacts, chart of accounts, and attachments.',
  },
  {
    icon: '📋',
    title: 'Audit trail',
    description: 'Comprehensive migration logs and reconciliation reports so your auditors and clients have full visibility.',
  },
  {
    icon: '🛡️',
    title: 'Safety net guarantee',
    description: '30-day post-migration support included with Enterprise. Free revisions if anything looks off.',
  },
];

export const WhySection: React.FC = () => {
  return (
    <section id="why" className="py-20 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-text-primary">
            Built by accountants, for accountants
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CARDS.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-bg-light border border-border rounded-xl p-6 hover:border-border-medium hover:shadow-card transition-all duration-200"
            >
              <div className="text-3xl mb-4">{card.icon}</div>
              <h3 className="text-base font-semibold text-text-primary mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
