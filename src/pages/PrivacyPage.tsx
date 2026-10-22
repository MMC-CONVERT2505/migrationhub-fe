import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ALL_SECTIONS,
  PRIVACY_EFFECTIVE,
  PRIVACY_UPDATED,
  type Block,
  type PolicySection,
} from '@/content/privacyPolicy';

const BlockView: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return (
        <p className="text-[15px] leading-relaxed text-text-secondary">
          {block.lead && <strong className="text-text-primary">{block.lead} </strong>}
          {block.content}
        </p>
      );
    case 'list':
      return (
        <ul className="list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-text-secondary marker:text-text-tertiary">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'table':
      return (
        // Scrolls sideways inside its own box on narrow screens instead of widening the page.
        <div className="overflow-x-auto rounded-xl border border-border bg-white" role="region" aria-label={block.caption} tabIndex={0}>
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">{block.caption}</caption>
            <thead className="bg-bg-light">
              <tr>
                {block.head.map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-border align-top">
                  {row.map((cell, c) => (
                    <td key={c} className={`px-4 py-3 leading-relaxed ${c === 0 ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};

const SectionView: React.FC<{ section: PolicySection }> = ({ section }) => (
  <section id={section.id} aria-labelledby={`${section.id}-h`} className="scroll-mt-24">
    <h2 id={`${section.id}-h`} className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{section.title}</h2>
    <div className="mt-4 space-y-4">
      {section.blocks.map((b, i) => <BlockView key={i} block={b} />)}
    </div>
  </section>
);

const Toc: React.FC = () => (
  <nav aria-label="On this page">
    <ol className="space-y-1.5 text-sm">
      {ALL_SECTIONS.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="block rounded-md px-2 py-1 text-text-secondary hover:bg-bg-light hover:text-text-primary">{s.title}</a>
        </li>
      ))}
    </ol>
  </nav>
);

/** True at the `lg` breakpoint and up; keeps a single table of contents in the DOM (one landmark, not two). */
function useIsDesktop(): boolean {
  const query = '(min-width: 1024px)';
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

const PrivacyPage: React.FC = () => {
  const { hash } = useLocation();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy Policy | Migration Hub';
    return () => { document.title = previous; };
  }, []);

  // A deep link (/privacy#retention) lands on its section; otherwise start at the top.
  useEffect(() => {
    const id = decodeURIComponent(hash.replace(/^#/, ''));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [hash]);

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar />
      <main>
        <section className="border-b border-border bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Migration Hub Privacy Policy</h1>
            <p className="mt-3 text-sm text-text-secondary">
              Effective date: {PRIVACY_EFFECTIVE} · Last updated: {PRIVACY_UPDATED}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {isDesktop ? (
              <Toc />
            ) : (
              // Collapsed on phones so the policy itself comes first.
              <details className="rounded-xl border border-border bg-white p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-primary">On this page</summary>
                <div className="mt-3"><Toc /></div>
              </details>
            )}
          </aside>

          <article className="min-w-0 space-y-12 pb-10">
            {ALL_SECTIONS.map((s) => <SectionView key={s.id} section={s} />)}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
