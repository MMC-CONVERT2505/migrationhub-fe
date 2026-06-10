import React from 'react';
import { motion } from 'framer-motion';

const METRICS = [
  { value: '100,000+', label: 'Migrations completed', icon: '🔄' },
  { value: '99.8%', label: 'Data accuracy rate', icon: '✅' },
  { value: '9', label: 'Platform pairs', icon: '🔗' },
  { value: '24/7', label: 'Expert support', icon: '🛡️' },
];

export const MetricsBar: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center"
            >
              <div className="text-3xl mb-1">{metric.icon}</div>
              <div className="text-2xl sm:text-3xl font-bold text-text-primary font-mono">
                {metric.value}
              </div>
              <div className="text-sm text-text-tertiary mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
