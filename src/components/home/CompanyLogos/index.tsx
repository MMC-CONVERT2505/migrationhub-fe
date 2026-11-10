import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Logo files live in /public/logos. If a partner asset is unavailable, the
// section falls back to a styled text badge so it never looks broken.
// `size` is the logo's height (and width cap): KPMG, Deloitte, Grant Thornton and BDO are shown larger on purpose.
const COMPANIES = [
  { name: 'KPMG', file: '/logos/kpmg.png', color: '#00338D', size: 'h-12 max-w-[170px]', text: 'text-3xl' },
  { name: 'Deloitte', file: '/logos/deloitte.jpg', color: '#000000', size: 'h-10 max-w-[200px]', text: 'text-3xl' },
  { name: 'Grant Thornton', file: '/logos/grant-thornton.png', color: '#4F2D7F', size: 'h-10 max-w-[210px]', text: 'text-2xl' },
  { name: 'BDO', file: '/logos/bdo_logo_color.png', color: '#E2001A', size: 'h-12 max-w-[150px]', text: 'text-4xl' },
  { name: 'RSM', file: '/logos/rsm.webp', color: '#3F9C35', size: 'h-9 max-w-[130px]', text: 'text-xl' },
  { name: 'Mazars', file: '/logos/mazars.jpg', color: '#0033A0', size: 'h-9 max-w-[140px]', text: 'text-xl' },
  { name: 'PKF', file: '/logos/pkf.png', color: '#003366', size: 'h-9 max-w-[130px]', text: 'text-xl' },
  { name: 'ShineWing', file: '/logos/shinewing.png', color: '#1F3263', size: 'h-14 max-w-[110px]', text: 'text-2xl' },
];

/** A firm logo on its own (no frame); falls back to its name in the firm's colour on load error. */
const CompanyLogo: React.FC<{ company: (typeof COMPANIES)[number] }> = ({ company }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex items-center justify-center h-14 px-0.5">
      {failed ? (
        <span className={`${company.text} font-extrabold tracking-tight`} style={{ color: company.color }}>
          {company.name}
        </span>
      ) : (
        <img
          src={company.file}
          alt={`${company.name} logo`}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`${company.size} w-auto object-contain`}
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
          <div className="grid flex-1 grid-cols-2 items-center justify-items-center gap-x-5 gap-y-4 sm:grid-cols-4">
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
