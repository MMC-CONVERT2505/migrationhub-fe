import React from 'react';
import { motion } from 'framer-motion';

const COMPANIES = [
  { name: 'KPMG', color: '#00338D' },
  { name: 'Deloitte', color: '#86BC25' },
  { name: 'Grant Thornton', color: '#FF6A13' },
  { name: 'BDO', color: '#E2001A' },
  { name: 'RSM', color: '#CC0000' },
  { name: 'Mazars', color: '#009FDA' },
  { name: 'PKF', color: '#00529B' },
];

export const CompanyLogos: React.FC = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-text-tertiary uppercase tracking-widest">
            Trusted by leading accounting firms
          </p>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {COMPANIES.map((company, i) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-center"
            >
              <div
                className="px-5 py-2.5 rounded-lg border border-border bg-white text-sm font-bold tracking-wide"
                style={{ color: company.color }}
              >
                {company.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
