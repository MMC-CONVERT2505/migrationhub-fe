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

/** A firm logo inside a bordered card; falls back to its name on load error. */
const CompanyLogo: React.FC<{ company: (typeof COMPANIES)[number] }> = ({ company }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center justify-center h-16 min-w-[112px] px-5 bg-white border border-border rounded-lg hover:border-border-medium hover:shadow-card transition-all duration-150">
      {failed ? (
        <span className="text-sm font-bold tracking-wide" style={{ color: company.color }}>
          {company.name}
        </span>
      ) : (
        <img
          src={company.file}
          alt={`${company.name} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-h-9 w-auto max-w-[140px] object-contain"
        />
      )}
    </div>
  );
};

export const CompanyLogos: React.FC = () => {
  return (
    <section className="py-10 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <span className="text-sm font-medium text-text-tertiary uppercase tracking-widest whitespace-nowrap flex-shrink-0">
            Trusted by
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {COMPANIES.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <CompanyLogo company={company} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
