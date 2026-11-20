import { describe, expect, it } from 'vitest';
import { walkPairsFrom, logoCandidates, CHOSEN_PLAN, JOURNEY_PAIR, WALK_PAIRS, WALK_PLANS, logoFor, money, planDates, planRange, platformName, toolName } from '../walkthroughData';

describe('walkthrough content mirrors the real screens', () => {
  it('lists the home page pairs in the home page order, with their free / paid / region status', () => {
    expect(WALK_PAIRS.map((p) => `${p.src}>${p.dst}:${p.status}`)).toEqual([
      'myob>qbo:free', 'qbo>freshbooks:free', 'qbo>myob:free',
      'qbo>xero:paid', 'tally>zoho:paid', 'xero>myob:free',
      'xero>prosaic:free', 'xero>qbo:region', 'xero>reckon:free',
    ]);
  });

  it('walks a paid pair and a free pair that really are paid and free on the home page', () => {
    const status = (k: { src: string; dst: string }) => WALK_PAIRS.find((p) => p.src === k.src && p.dst === k.dst)?.status;
    expect(status(JOURNEY_PAIR.paid)).toBe('paid');
    expect(status(JOURNEY_PAIR.free)).toBe('free');
  });

  it('has a real bundled logo for every platform the pairs use', () => {
    for (const p of WALK_PAIRS) {
      expect(logoFor(p.src)).toMatch(/^\/logos\//);
      expect(logoFor(p.dst)).toMatch(/^\/logos\//);
    }
  });

  it('names platforms as the pages do', () => {
    expect(platformName('qbo')).toBe('QuickBooks Online');
    expect(platformName('myob')).toBe('MYOB');
    expect(toolName('qbo')).toBe('QBO');
  });

  it('shows the three plans with the live Australian prices', () => {
    expect(WALK_PLANS.map((p) => [p.name, money(p.price)])).toEqual([['Basic', 'A$549'], ['Standard', 'A$849'], ['Enterprise', 'A$1,449']]);
    expect(WALK_PLANS.filter((p) => p.popular).map((p) => p.name)).toEqual(['Standard']);
  });

  it('chooses Standard when paying and the free Basic plan when not', () => {
    expect(CHOSEN_PLAN.paid.name).toBe('Standard');
    expect(CHOSEN_PLAN.free.name).toBe('Basic');
  });

  it('works out the date range exactly as the order summary does (Standard covers four financial years)', () => {
    const range = planRange('paid');
    expect(range).toMatch(/^1 Jul \d{4} – \d{1,2} [A-Z][a-z]{2} \d{4}$/);
    const paidStart = Number(range.slice(6, 10));
    const freeStart = Number(planRange('free').slice(6, 10));
    expect(freeStart - paidStart).toBe(2); // two more years of history cost two years of start date
    expect(planDates('free').start).toMatch(/^01 Jul \d{4}$/);
  });
});

describe('pairs from the live listing', () => {
  it('keys platforms the way the walkthrough does and keeps logos and free countries', () => {
    const [p] = walkPairsFrom([{ src: 'QBO', dst: 'Xero', status: 'region', srcLogo: '/a.png', dstLogo: null, freeCountries: ['Australia'] }]);
    expect(p).toEqual({ src: 'qbo', dst: 'xero', status: 'region', srcLogo: '/a.png', dstLogo: null, freeCountries: ['Australia'] });
  });

  it('copes with an empty listing and with missing logos', () => {
    expect(walkPairsFrom([])).toEqual([]);
    expect(walkPairsFrom([{ src: 'ZOHO', dst: 'Tally', status: 'paid' }])[0]).toMatchObject({ src: 'zoho', dst: 'tally', srcLogo: null, dstLogo: null });
  });

  it('names a platform it has never heard of by its own key rather than crashing', () => {
    expect(platformName('sage')).toBe('sage');
    expect(logoFor('sage')).toBeNull();
  });
});

describe('logo fallback order', () => {
  it('tries the live logo, then the bundled mark, and ends at the name', () => {
    expect(logoCandidates('https://cdn/x.png', '/logos/qbo.svg')).toEqual(['https://cdn/x.png', '/logos/qbo.svg']);
    expect(logoCandidates(null, '/logos/qbo.svg')).toEqual(['/logos/qbo.svg']);
    expect(logoCandidates(undefined, null)).toEqual([]);
  });

  it('never tries the same source twice, or an empty one', () => {
    expect(logoCandidates('/logos/qbo.svg', '/logos/qbo.svg')).toEqual(['/logos/qbo.svg']);
    expect(logoCandidates('', '/logos/qbo.svg')).toEqual(['/logos/qbo.svg']);
  });
});
