import React from 'react';
import { motion } from 'framer-motion';
import { TRUST_METRICS } from '@/content/trustMetrics';

export const Hero: React.FC = () => {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-bg-light pt-10 pb-16 sm:pt-14 lg:pt-16 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 min-[769px]:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-14">
        <motion.div
          // The hero is the first paint (and the LCP): ship it visible in the prerendered HTML instead of fading it in.
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <h1 id="hero-title" className="text-[2rem] sm:text-5xl lg:text-[3.5rem] font-bold text-text-primary leading-[1.15] tracking-tight">
            MigrationHub: move your accounting data{' '}
            <span className="text-blue-600">right now</span>
            , in minutes
          </h1>

          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-[520px]">
            No waiting for quotes, queues or uploading files. Start your data migration right now and be done in minutes.
          </p>

          <div className="mt-8 flex items-center gap-6">
            <div className="flex -space-x-2">
              {['#E8820C', '#16a34a', '#2563eb', '#9b1c1c'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              {TRUST_METRICS.rating && TRUST_METRICS.firmsServed && (
                <p className="text-xs text-text-secondary mt-0.5">Rated {TRUST_METRICS.rating}/5 by {TRUST_METRICS.firmsServed} accounting firms</p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center min-[769px]:justify-end">
          <img
            src="/static/laptop-analytics.svg"
            alt="Migration Hub analytics dashboard"
            width={560}
            height={370}
            className="h-auto w-full max-w-[360px] min-[769px]:max-w-[420px] xl:max-w-[520px] motion-safe:animate-float"
          />
        </div>
        </div>
      </div>
    </section>
  );
};
