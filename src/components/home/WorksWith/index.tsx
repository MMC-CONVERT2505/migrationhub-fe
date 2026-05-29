import React from 'react';
import { motion } from 'framer-motion';
import { WORKS_WITH_PLATFORMS } from '@/constants/logos';
import { PlatformLogo } from '@/components/common/PlatformLogo';

export const WorksWith: React.FC = () => {
  return (
    <section className="py-10 bg-bg-light border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <span className="text-sm font-medium text-text-tertiary whitespace-nowrap flex-shrink-0">
            Works with
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            {WORKS_WITH_PLATFORMS.map((platform, i) => (
              <motion.div
                key={platform.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg hover:border-border-medium hover:shadow-card transition-all duration-150"
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold font-mono flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.abbr.slice(0, 1)}
                </div>
                <span className="text-sm font-medium text-text-secondary">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
