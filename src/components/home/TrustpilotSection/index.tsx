import React from 'react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    name: 'Sarah Mitchell',
    role: 'Senior Partner, BDO Australia',
    rating: 5,
    text: 'MMC Convert saved us 3 weeks of manual data entry. The migration was flawless — every invoice, contact and transaction came across perfectly. The reconciliation report gave our client confidence.',
    date: 'March 2024',
  },
  {
    name: 'James Whitford',
    role: 'CPA, Grant Thornton',
    rating: 5,
    text: 'We migrated a complex multi-entity client from Xero to QBO. 4,500+ records with zero errors. The dedicated specialist walked us through every step. Worth every cent.',
    date: 'February 2024',
  },
  {
    name: 'Priya Sharma',
    role: 'Finance Director, Nexus Group',
    rating: 5,
    text: "Finally a migration tool that actually works. We've tried others but MMC Convert is in a different league. The UI is clear, the support is outstanding, and our data was perfect.",
    date: 'January 2024',
  },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-[#00B67A]' : 'text-gray-200'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export const TrustpilotSection: React.FC = () => {
  return (
    <section id="reviews" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trustpilot header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-[#00B67A] text-white text-xs font-bold px-2 py-1 rounded">
              ★ Trustpilot
            </div>
          </div>
          <h2 className="text-3xl font-bold text-text-primary">
            Rated Excellent by accountants
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <StarRating rating={5} />
            <span className="text-2xl font-bold text-text-primary">4.9</span>
            <span className="text-text-tertiary text-sm">out of 5 · 600+ reviews</span>
          </div>
        </motion.div>

        {/* Review cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-border rounded-xl p-6 hover:shadow-card transition-shadow duration-200"
            >
              <StarRating rating={review.rating} />
              <p className="mt-4 text-sm text-text-secondary leading-relaxed">
                "{review.text}"
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-semibold text-text-primary">{review.name}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{review.role}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{review.date}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
