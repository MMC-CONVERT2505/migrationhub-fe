import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EXTERNAL_LINKS } from '@/constants/links';
import { goToSection } from '@/utils/scroll';
import { LogoMark } from '@/components/layout/Navbar';

type FooterLink =
  | { label: string; to: string }
  | { label: string; section: string }
  | { label: string; href: string };

// Every entry goes somewhere real: an in-app route, a home-page section, or the main MMC Convert site.
const FOOTER_LINKS: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Migrations', section: 'pairs' },
    { label: 'Pricing', section: 'pricing' },
    { label: 'Security', href: EXTERNAL_LINKS.security },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', href: EXTERNAL_LINKS.blog },
    { label: 'Careers', href: EXTERNAL_LINKS.careers },
  ],
  Support: [
    { label: 'Knowledge Base', href: EXTERNAL_LINKS.knowledgeBase },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: EXTERNAL_LINKS.privacy },
    { label: 'Terms of Service', href: EXTERNAL_LINKS.terms },
  ],
};

const LINK_CLASS = 'text-sm text-text-tertiary hover:text-text-secondary transition-colors';

/** Slim footer for task pages (flow, tracker, history): same copyright line as the full one. */
export const CompactFooter: React.FC = () => (
  <footer className="mt-auto border-t border-border bg-white">
    <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-xs text-text-secondary">
      &copy; {new Date().getFullYear()} MMC Convert. All rights reserved.
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
              Enterprise-grade accounting data migration. Fast, accurate, and secure.
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
          <p className="text-sm text-text-tertiary">
            &copy; {new Date().getFullYear()} MMC Convert. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              SOC 2 Compliant
            </span>
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
