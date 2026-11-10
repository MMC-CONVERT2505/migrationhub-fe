import React from 'react';

const ALT = 'How it works: 1. Choose your migration. 2. Place your order. 3. Connect both accounts. 4. Migrate and verify.';

/** Home-page "How it Works?" section: the four steps as a single image (stacked on a phone so the text stays readable). */
export const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="py-16 bg-white border-b border-border" aria-labelledby="how-it-works-title">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Simple by design</p>
        <h2 id="how-it-works-title" className="mt-2 text-3xl md:text-4xl font-bold text-text-primary tracking-tight">How it Works?</h2>
      </div>
      <picture>
        <source media="(max-width: 767px)" srcSet="/static/how-it-works-mobile.svg" width={440} height={560} />
        <img
          src="/static/how-it-works.svg"
          alt={ALT}
          width={1200}
          height={230}
          loading="lazy"
          decoding="async"
          className="mx-auto mt-8 h-auto w-full max-w-[1000px] max-md:max-w-[400px]"
        />
      </picture>
    </div>
  </section>
);
