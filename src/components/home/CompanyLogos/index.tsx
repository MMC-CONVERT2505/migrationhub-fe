import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Logo files live in /public/logos. Drop a matching file in and it renders
// automatically; until then each firm falls back to a styled text badge so
// the section never looks broken. Only the firms listed here are referenced.
const COMPANIES = [
  { name: 'KPMG', file: '/logos/kpmg.png', color: '#00338D' },
  { name: 'Deloitte', file: '/logos/deloitte.jpg', color: '#000000' },
  { name: 'Grant Thornton', file: '/logos/grant-thornton.png', color: '#4F2D7F' },
  { name: 'BDO', file: '/logos/bdo.svg', color: '#E2001A' },
  { name: 'RSM', file: '/logos/rsm.webp', color: '#3F9C35' },
  { name: 'Mazars', file: '/logos/mazars.jpg', color: '#0033A0' },
  { name: 'PKF', file: '/logos/pkf.png', color: '#003366' },
];

const CompanyLogo: React.FC<{
  company: (typeof COMPANIES)[number];
}> = ({ company }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="px-5 py-2.5 rounded-lg border border-border bg-white text-sm font-bold tracking-wide"
        style={{ color: company.color }}
      >
        {company.name}
      </div>
    );
  }

  return (
    <img
      src={company.file}
      alt={`${company.name} logo`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 md:h-10 w-auto object-contain grayscale opacity-70 transition hover:grayscale-0 hover:opacity-100"
    />
  );
};

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

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
          {COMPANIES.map((company, i) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center justify-center"
            >
              <CompanyLogo company={company} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
