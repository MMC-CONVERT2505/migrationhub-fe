import { describe, expect, it } from 'vitest';

// Customer-facing pages must not claim a certification we have not been told we hold.
const sources = import.meta.glob(
  [
    '/src/pages/AboutPage.tsx',
    '/src/components/home/WhySection/index.tsx',
    '/src/components/migration/FaqAccordion/index.tsx',
    '/src/components/layout/Footer/index.tsx',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

describe('unverified compliance claims', () => {
  it('checks the four files', () => {
    expect(Object.keys(sources)).toHaveLength(4);
  });
  it.each(Object.entries(sources))('%s makes no SOC 2 claim', (_file, text) => {
    expect(text).not.toMatch(/soc ?2/i);
  });
});
