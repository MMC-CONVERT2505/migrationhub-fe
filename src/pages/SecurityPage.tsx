import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { CONTACT_EMAIL } from '@/constants/links';
import {
  CERTIFICATION,
  CONTROL,
  DATA_JOURNEY,
  PROTECTIONS,
  SECURITY_BADGES,
  SECURITY_CONTACT,
  SECURITY_INTRO,
  SECURITY_UPDATED,
  type ProtectionIcon,
} from '@/content/security';

const ICON_PATHS: Record<ProtectionIcon, string> = {
  cloud: 'M3 15a4 4 0 014-4 5 5 0 019.6-1A4 4 0 0117 19H7a4 4 0 01-4-4z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  key: 'M15 7a4 4 0 11-3.9 4.9L4 19v2h3l1-1v-2h2l1.5-1.5',
  shield: 'M9 12l2 2 4-4m5.6-4A12 12 0 0112 2.9 12 12 0 013.4 6 12 12 0 003 9c0 5.6 3.8 10.3 9 11.6 5.2-1.3 9-6 9-11.6 0-1-.1-2-.4-3z',
  scan: 'M21 21l-4.3-4.3M10.5 17a6.5 6.5 0 110-13 6.5 6.5 0 010 13z',
  bug: 'M12 20a6 6 0 01-6-6v-2a6 6 0 0112 0v2a6 6 0 01-6 6zm0-14V3m-4 5L5 5m11 3l3-3M6 13H3m18 0h-3',
  backup: 'M4 7c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zm0 0v5c0 1.1 3.6 2 8 2s8-.9 8-2V7m-16 5v5c0 1.1 3.6 2 8 2s8-.9 8-2v-5',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L2.2 18a2 2 0 001.7 3h16.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
};

const Icon: React.FC<{ d: string; className?: string }> = ({ d, className = 'h-5 w-5' }) => (
  <svg aria-hidden focusable="false" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const CHECK = 'M5 13l4 4L19 7';

const SectionHeading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">{children}</h2>
);

const SecurityPage: React.FC = () => (
  <div className="min-h-screen bg-bg">
    <Navbar />

    <main>
      <Breadcrumbs />

      {/* Hero */}
      <section className="pt-10 pb-10 sm:pt-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-light px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-blue-700">Security</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Security at <span className="text-blue-600">Migration Hub</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-text-secondary">{SECURITY_INTRO}</p>

          <ul aria-label="Security at a glance" className="mt-8 flex flex-wrap gap-2.5">
            {SECURITY_BADGES.map((badge, i) => (
              <li
                key={badge}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                  i === 0 ? 'border-blue-200 bg-blue-light text-blue-700' : 'border-border bg-white text-text-secondary'
                }`}
              >
                <Icon d={CHECK} className="h-3.5 w-3.5 text-green-600" />
                {badge}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-text-tertiary">Last updated {SECURITY_UPDATED}</p>
        </div>
      </section>

      {/* What happens to your data */}
      <section aria-labelledby="journey-title" className="border-y border-border bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading id="journey-title">{DATA_JOURNEY.heading}</SectionHeading>
          <p className="mt-3 max-w-2xl text-text-secondary">{DATA_JOURNEY.intro}</p>
          <ol className="mt-10 space-y-0">
            {DATA_JOURNEY.steps.map((step, i) => (
              <li key={step.title} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 sm:gap-x-6">
                {i < DATA_JOURNEY.steps.length - 1 && <span aria-hidden className="absolute left-[1.0625rem] top-9 bottom-0 w-px bg-border" />}
                <span aria-hidden className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {step.when && (
                      <span className="rounded-full bg-blue-light px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-blue-700">{step.when}</span>
                    )}
                    <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 max-w-2xl leading-relaxed text-text-secondary">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* How we protect it */}
      <section aria-labelledby="protect-title" className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading id="protect-title">{PROTECTIONS.heading}</SectionHeading>
          <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {PROTECTIONS.items.map((item) => (
              <li key={item.title} className="rounded-2xl border border-border bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-light text-blue-600">
                  <Icon d={ICON_PATHS[item.icon]} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* You stay in control */}
      <section aria-labelledby="control-title" className="border-y border-border bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading id="control-title">{CONTROL.heading}</SectionHeading>
          <p className="mt-3 max-w-2xl text-text-secondary">{CONTROL.intro}</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CONTROL.items.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-bg-light p-4 text-[15px] leading-relaxed text-text-secondary">
                <Icon d={CHECK} className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Certification and privacy */}
      <section aria-labelledby="cert-title" className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading id="cert-title">{CERTIFICATION.heading}</SectionHeading>
          <dl className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
            {CERTIFICATION.rows.map((row) => (
              <div key={row.term} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6">
                <dt className="font-semibold text-text-primary">{row.term}</dt>
                <dd className="leading-relaxed text-text-secondary">{row.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Contact */}
      <section aria-labelledby="contact-title" className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-blue-600 px-6 py-10 text-center sm:px-12">
            <h2 id="contact-title" className="text-2xl font-bold text-white sm:text-3xl">{SECURITY_CONTACT.heading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100">{SECURITY_CONTACT.text}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              Contact: {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default SecurityPage;
