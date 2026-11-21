import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HowItWorks } from '../HowItWorks';
import { CompanyLogos } from '../CompanyLogos';
import { TrustpilotSection } from '../TrustpilotSection';

const html = (el: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('home page: How it Works?', () => {
  const markup = html(<HowItWorks />);
  const PAID = ['Choose your migration', 'Prepare your order', 'Pay securely', 'Connect both accounts', 'Migrate and verify', 'Check the comparative report'];
  it('keeps its id and heading', () => {
    expect(markup).toContain('id="how-it-works"');
    expect(text(markup)).toContain('How it Works?');
  });
  it('lets the visitor pick the paid or the free journey (paid first, nothing else pre-chosen)', () => {
    expect(markup).toContain('aria-label="Migration type"');
    const toggles = [...markup.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*>([^<]*)<\/button>/g)].map((m) => [m[1], m[2]]);
    expect(toggles).toEqual([['true', 'Paid migration'], ['false', 'Free migration']]);
  });
  it('is a real tablist: six tabs in order, one selected, each pointing at the panel', () => {
    expect(markup).toContain('role="tablist"');
    const tabs = [...markup.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
    expect(tabs).toHaveLength(6);
    expect(tabs.filter((t) => t.includes('aria-selected="true"'))).toHaveLength(1);
    expect(tabs[0]).toContain('aria-selected="true"');
    expect(tabs.every((t) => t.includes('aria-controls="hiw-panel"'))).toBe(true);
    expect(tabs.filter((t) => t.includes('tabindex="0"'))).toHaveLength(1);
    const t = text(markup);
    const at = PAID.map((x) => t.indexOf(x));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((x, y) => x - y)).toEqual(at);
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain('aria-labelledby="hiw-tab-0"');
  });
  it('states the first step in real text in the caption (the picture is decorative)', () => {
    expect(text(markup)).toContain('Pick the platform you are moving from and the one you are moving to.');
    expect(markup).toMatch(/<div aria-hidden="true" data-hiw-window/);
  });
  it('shows the home page pair cards as the first scene, with Free and Paid labels', () => {
    const window = markup.slice(markup.indexOf('data-hiw-window'));
    expect(text(window)).toContain('Select your migration path');
    expect(text(window)).toMatch(/Free/);
    expect(text(window)).toMatch(/Paid/);
  });
  it('no longer uses the old image, and shows the real platform logos on the pair cards', () => {
    expect(markup).not.toMatch(/<picture|how-it-works(-mobile)?\.svg/);
    const logos = [...markup.matchAll(/<img [^>]*src="(\/logos\/[^"]+)"/g)].map((m) => m[1]);
    expect(logos).toEqual(expect.arrayContaining(['/logos/myob.svg', '/logos/qbo.svg', '/logos/xero.svg', '/logos/freshbooks.svg', '/logos/tally.svg', '/logos/zoho_books.png', '/logos/prosaic.svg', '/logos/reckon.svg']));
  });
  it('lists the same nine pairs as the home page, with their real labels', () => {
    const window = text(markup.slice(markup.indexOf('data-hiw-window')));
    expect((markup.match(/<li [^>]*class="[^"]*rounded-xl[^"]*"/g) ?? []).length).toBeGreaterThanOrEqual(9);
    expect(window).toContain('Start free →');
    expect(window).toContain('See pricing →');
    expect(window).toContain('Check your region →');
    expect(window).toContain('Free in Australia, New Zealand, Singapore, United Arab Emirates, South Africa');
    expect(window).toContain('Paid elsewhere');
  });
  it('offers a way on: a link to the migration pairs', () => {
    expect(markup).toMatch(/<a [^>]*href="#pairs"[^>]*>\s*Pick your migration path/);
  });
  it('does not bring back the removed "Start your migration" call to action', () => {
    expect(text(markup)).not.toMatch(/Start your migration/);
  });
});

describe('home page: Trusted by, Trustpilot', () => {
  it('"Trusted by" is a centred h2 above the logos', () => {
    const markup = html(<CompanyLogos />);
    const h = /<h2 class="([^"]*)">\s*Trusted by\s*<\/h2>/.exec(markup);
    expect(h).not.toBeNull();
    expect(h![1]).toContain('text-center');
    expect(markup.indexOf('Trusted by')).toBeLessThan(markup.indexOf('<img'));
  });
  it('drops "Trusted by accountants & businesses worldwide" and keeps the Trustpilot heading', () => {
    const t = text(html(<TrustpilotSection />));
    expect(t).not.toMatch(/Trusted by accountants/);
    expect(t).toMatch(/Rated excellent on Trustpilot|What our customers say/);
  });
});
