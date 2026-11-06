import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { number: '01', title: 'Choose your migration', icon: '↔' },
  { number: '02', title: 'Place your order', icon: '✓' },
  { number: '03', title: 'Connect both accounts', icon: '◎' },
  { number: '04', title: 'Migrate and verify', icon: '↗' },
];

export const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="py-20 bg-white border-y border-border scroll-mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">How it Works?</p>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
          Move your books in four simple steps
        </h2>
      </motion.div>

      <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        <div className="absolute left-[12%] right-[12%] top-12 hidden h-px bg-blue-100 lg:block" aria-hidden="true" />
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="relative flex flex-col items-center text-center px-4"
          >
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-8 border-white bg-blue-50 text-3xl font-semibold text-blue-600 shadow-card">
              {step.icon}
            </div>
            <span className="mt-5 text-xs font-bold tracking-widest text-orange-500">{step.number}</span>
            <h3 className="mt-2 text-base font-semibold text-text-primary">{step.title}</h3>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
