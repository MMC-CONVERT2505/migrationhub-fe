import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CONTACT_EMAIL, CONTACT_PHONE } from '@/constants/links';
import { copyrightNotice } from '@/utils/copyright';
import { goToSection } from '@/utils/scroll';
import { LogoMark } from '@/components/layout/Navbar';
import { NAV_TEXT_MUTED } from '@/constants/navStyles';
import { WhatsAppIcon } from '@/components/common/WhatsAppIcon';
import { whatsappLink } from '@/utils/whatsapp';

type FooterLink =
  | { label: string; to: string }
  | { label: string; section: string }
  | { label: string; href: string };

// Every entry goes somewhere real: an in-app route, a home-page section, or the main MMC Convert site.
const FOOTER_LINKS: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Migrations', section: 'pairs' },
    { label: 'Pricing', section: 'pricing' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'Security', to: '/security' },
  ],
  Company: [
    { label: 'About', to: '/about' },
  ],
  Support: [
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Use', to: '/termsofuse' },
  ],
};

const LINK_CLASS = `text-sm ${NAV_TEXT_MUTED}`;

/** Opens a WhatsApp chat with the site's number, built from the same CONTACT_PHONE constant as everything else. */
const WHATSAPP_URL = whatsappLink(CONTACT_PHONE);

/** Slim footer for task pages (flow, tracker, history): same copyright line as the full one. */
export const CompactFooter: React.FC = () => (
  <footer className="mt-auto border-t border-border bg-white">
    <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-text-secondary">
      {copyrightNotice()}
    </p>
  </footer>
);

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <footer className="bg-white border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <LogoMark />
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-blue-700 text-lg tracking-tight">Migration Hub</span>
                <span className="text-[11px] text-text-primary">Powered by MMC Convert</span>
              </span>
            </Link>
            <p className="text-sm text-text-tertiary leading-relaxed">
              Switching accounting software before your coffee{' '}
              <svg aria-hidden focusable="false" className="inline-block h-[1.1em] w-[1.1em] -mt-0.5 align-middle text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9h12v6a5 5 0 01-5 5H9a5 5 0 01-5-5V9z" />
                <path d="M16 11h1.5a2.5 2.5 0 010 5H16" />
                <path d="M8 2.5c-.7 1 .7 1.6 0 2.8M12 2.5c-.7 1 .7 1.6 0 2.8" />
              </svg>{' '}
              gets cold.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className={LINK_CLASS}>{link.label}</Link>
                    ) : 'section' in link ? (
                      <a
                        href={`/#${link.section}`}
                        onClick={(e) => { e.preventDefault(); goToSection(link.section, pathname, navigate); }}
                        className={LINK_CLASS}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-x-8 gap-y-1 text-sm text-text-tertiary">
            <p>{copyrightNotice()}</p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={NAV_TEXT_MUTED}>{CONTACT_EMAIL}</a>
            {WHATSAPP_URL ? (
              // Icon and number are ONE link: a computer has no app for tel: links (the browser just shows "No Apps
              // Available"), while wa.me opens the WhatsApp app on a phone and WhatsApp Web on a computer.
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Chat with us on WhatsApp: ${CONTACT_PHONE} (opens in a new tab)`}
                title="Chat with us on WhatsApp"
                className={`inline-flex min-h-8 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 ${NAV_TEXT_MUTED}`}
              >
                <WhatsAppIcon className="h-5 w-5 flex-shrink-0 text-green-700" />
                <span>{CONTACT_PHONE}</span>
              </a>
            ) : (
              // Only if the number is ever not a usable international number: fall back to a plain call link.
              <a href={`tel:${CONTACT_PHONE}`} className={NAV_TEXT_MUTED}>{CONTACT_PHONE}</a>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              256-bit SSL
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              GDPR Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
