import React from 'react';
import { motion } from 'framer-motion';

const TRUSTPILOT_GREEN = '#00B67A';
const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

const STATS = [
  { value: '100,000+', label: 'conversions completed' },
  { value: '800+', label: '5-star reviews' },
  { value: '12+ yrs', label: 'conversion expertise' },
  { value: '98%', label: 'would recommend' },
];

const REVIEWS = [
  {
    initial: 'S',
    name: 'Sarah M.',
    path: 'QuickBooks Desktop → QBO',
    timeAgo: '2 weeks ago',
    text: 'Daily updates kept us informed at every step. The transition was smooth, stress-free, and every query got a fast, personal response.',
  },
  {
    initial: 'D',
    name: 'David T.',
    path: 'Sage → QuickBooks Online',
    timeAgo: '1 month ago',
    text: 'Handled our migration with real professionalism. Completed efficiently with no complications — we’d gladly use them again.',
  },
  {
    initial: 'B',
    name: 'Bill R.',
    path: 'Reckon Accounts → Reckon One',
    timeAgo: '3 weeks ago',
    text: 'Years of workbooks migrated accurately and quickly. Communication and progress reporting throughout were excellent.',
  },
];

/** Trustpilot-style row of green star tiles. */
const StarTiles: React.FC<{ size?: number; count?: number }> = ({ size = 28, count = 5 }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className="flex items-center justify-center rounded-[3px]"
        style={{ width: size, height: size, backgroundColor: TRUSTPILOT_GREEN }}
      >
        <svg
          className="text-white"
          style={{ width: size * 0.66, height: size * 0.66 }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d={STAR_PATH} />
        </svg>
      </span>
    ))}
  </div>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export const TrustpilotSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20 bg-bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
            Trusted by accountants &amp; businesses worldwide
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
            Rated excellent on Trustpilot
          </h2>

          {/* Rating line */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-text-secondary">
            <StarTiles size={28} />
            <span className="font-bold text-text-primary">4.8 / 5</span>
            <span className="text-border">|</span>
            <span>
              Based on <span className="font-semibold text-text-primary">1,000+ reviews</span>
            </span>
            <span className="text-border">|</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded text-white text-xs font-bold"
                style={{ backgroundColor: TRUSTPILOT_GREEN }}
              >
                T
              </span>
              <span className="font-semibold text-text-primary">Trustpilot</span>
            </span>
            <span className="inline-flex items-center gap-1 text-green-600">
              <CheckIcon /> Verified on Trustpilot
            </span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-white border border-border rounded-xl px-6 py-7 text-center"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
                {s.value}
              </div>
              <div className="mt-1.5 text-xs text-text-tertiary">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Review cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-border rounded-xl p-6 flex flex-col"
            >
              <StarTiles size={22} />
              <p className="mt-4 flex-1 text-sm text-text-secondary leading-relaxed">
                “{review.text}”
              </p>
              <div className="mt-5 flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {review.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{review.name}</p>
                  <p className="text-xs text-text-tertiary">{review.path}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{review.timeAgo}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 whitespace-nowrap">
                  <CheckIcon className="w-3 h-3" /> Verified
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <a
            href="https://www.trustpilot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-3 bg-white border border-border rounded-lg text-sm font-semibold text-text-primary hover:border-border-medium hover:shadow-card transition-all duration-150"
          >
            Read all 1,000+ reviews on Trustpilot
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};
