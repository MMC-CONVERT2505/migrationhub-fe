import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { OFFICES, TEAM, type TeamMember } from '@/content/team';

const SOCIAL_LINK =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary transition-colors hover:border-blue-300 hover:bg-blue-light hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';

const LinkedInIcon = (
  <svg aria-hidden className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
  </svg>
);

const WhatsAppIcon = (
  <svg aria-hidden className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88zM20.52 3.45A11.8 11.8 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.41z" />
  </svg>
);

const MemberCard: React.FC<{ member: TeamMember; flip: boolean }> = ({ member, flip }) => (
  <article
    className={`grid grid-cols-1 items-center gap-6 rounded-2xl border border-border bg-white p-6 sm:p-8 md:gap-10 ${
      // The photo is the narrow column, on whichever side it sits.
      flip ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,240px)]' : 'md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]'
    }`}
  >
    <img
      src={member.photo}
      alt={`${member.name}, ${member.role}`}
      width={458}
      height={459}
      loading="lazy"
      className={`mx-auto aspect-square w-full max-w-[240px] rounded-2xl object-cover ${flip ? 'md:order-2' : ''}`}
    />
    <div className={flip ? 'md:order-1' : ''}>
      <h2 className="text-2xl font-bold tracking-tight text-text-primary">
        {member.name}
        <span className="font-semibold text-blue-600"> - {member.role}</span>
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary sm:text-base">
        {member.bio.map((paragraph) => (
          <p key={paragraph.slice(0, 32)}>{paragraph}</p>
        ))}
      </div>
      <ul className="mt-5 flex items-center gap-3">
        <li>
          <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn (opens in a new tab)`} className={SOCIAL_LINK}>
            {LinkedInIcon}
          </a>
        </li>
        <li>
          <a href={`https://wa.me/${member.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`Message ${member.name} on WhatsApp (opens in a new tab)`} className={SOCIAL_LINK}>
            {WhatsAppIcon}
          </a>
        </li>
      </ul>
    </div>
  </article>
);

const AboutPage: React.FC = () => (
  <div className="min-h-screen bg-bg">
    <Navbar />

    <main>
      <Breadcrumbs />

      <section className="pt-12 pb-10 sm:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-light px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-blue-700">About Migration Hub</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary sm:text-5xl">
            Our <span className="text-blue-600">Team</span>
          </h1>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          {TEAM.map((member, i) => (
            <MemberCard key={member.name} member={member} flip={i % 2 === 1} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-white py-14" aria-labelledby="offices-title">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 id="offices-title" className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Our Offices
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OFFICES.map((office) => (
              <li key={office.region} className="rounded-xl border border-border bg-bg-light p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{office.region}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{office.address}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default AboutPage;
