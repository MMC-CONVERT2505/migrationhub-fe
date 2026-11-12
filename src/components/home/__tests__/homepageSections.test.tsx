import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { WhySection } from '../WhySection';
import { HowItWorks } from '../HowItWorks';
import { CompanyLogos } from '../CompanyLogos';
import { TrustpilotSection } from '../TrustpilotSection';

const html = (el: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

describe('home page: Built by accountants, for accountants', () => {
  const markup = html(<WhySection />);
  it('links "Privacy Policy" in the Enterprise security card to /privacy, and only that text', () => {
    const links = [...markup.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)];
    expect(links).toHaveLength(1);
    expect(links[0][1]).toBe('/privacy');
    expect(links[0][2].trim()).toBe('Privacy Policy');
  });
  it('replaces the safety-net card with the accuracy check, word for word', () => {
    const t = text(markup);
    expect(t).toContain('Built-in accuracy check');
    expect(t).toContain('Our software checks every record and balance against your source the moment your migration finishes. Anything missing or off? We fix it free within 7 days.');
    expect(t).not.toMatch(/Safety net guarantee|30-day post-migration support|Free revisions/);
  });
  it('still has six cards', () => {
    expect((markup.match(/<h3/g) ?? []).length).toBe(6);
  });
});

describe('home page: How it Works?', () => {
  const markup = html(<HowItWorks />);
  const PAID = ['Choose your migration', 'Prepare your order', 'Pay securely', 'Connect both accounts', 'Migrate and verify'];
  it('keeps its id and heading', () => {
    expect(markup).toContain('id="how-it-works"');
    expect(text(markup)).toContain('How it Works?');
  });
  it('lets the visitor pick the paid or the free journey (paid first, nothing else pre-chosen)', () => {
    expect(markup).toContain('aria-label="Migration type"');
    const toggles = [...markup.matchAll(/<button[^>]*aria-pressed="(true|false)"[^>]*>([^<]*)<\/button>/g)].map((m) => [m[1], m[2]]);
    expect(toggles).toEqual([['true', 'Paid migration'], ['false', 'Free migration']]);
  });
  it('is a real tablist: five tabs in order, one selected, each pointing at the panel', () => {
    expect(markup).toContain('role="tablist"');
    const tabs = [...markup.matchAll(/<button[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);
    expect(tabs).toHaveLength(5);
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
  it('no longer uses the old image', () => {
    expect(markup).not.toMatch(/<img|<picture|how-it-works(-mobile)?\.svg/);
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
