import React from 'react';
import { motion } from 'framer-motion';

export const Hero: React.FC = () => {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-bg-light pt-10 pb-12 sm:pt-14 lg:pt-14 lg:pb-12">
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
            Migration Hub: move your accounting data{' '}
            <span className="text-blue-600">right now</span>
            , in minutes
          </h1>

          <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-[520px]">
            No waiting for quotes, queues or uploading files. Start your data migration right now and be done in minutes.
          </p>
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
