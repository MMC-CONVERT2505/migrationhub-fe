import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { useAuthStore, useSession } from '@/store/authStore';
import { useAuthScope } from '@/hooks/useAuthScope';
import { authService } from '@/api/auth';
import { goToSection } from '@/utils/scroll';
import { OperationTeamBadge } from '@/components/auth/OperationTeamBadge';
import { NAV_TEXT } from '@/constants/navStyles';

interface NavbarProps {
  variant?: 'default' | 'admin';
  /** Default variant only: show a Back button before the logo (used by the flow, tracker and history pages). */
  showBack?: boolean;
  /** Hide Sign in / Get started for a signed-out visitor — set on the pair-flow pages, where they would break the order. */
  hideAuthCta?: boolean;
}

/** Header links. Section links scroll on the home page; Contact Us is a route. */
const NAV_LINKS = [
  { label: 'What we convert', href: '#pairs' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Platforms', to: '/supported-platforms' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact Us', to: '/contact' },
] as const;


// ─── Profile dropdown (desktop) ───────────────────────────────────────────────
const UserMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const scope = useAuthScope();
  const { user } = useSession(scope);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout(scope);
    navigate(scope === 'admin' ? '/admin/login' : '/sign-in');
  };

  const displayName = user ? `${user.firstname} ${user.lastname}`.trim() : 'My Account';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-light transition-colors"
      >
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-100"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center ring-2 ring-blue-100">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
        <span className="text-sm font-medium text-text-primary hidden sm:block">
          {user?.firstname ?? 'Account'}
        </span>
        <OperationTeamBadge className="hidden sm:inline-flex" />
        <svg
          className={cn('w-3.5 h-3.5 text-text-tertiary transition-transform', open && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-elevated border border-border z-50 py-1 overflow-hidden"
          >
            {/* User info header */}
            <div className="px-3 py-2.5 border-b border-border">
              <p className="text-sm font-semibold text-text-primary truncate">{displayName}</p>
              <OperationTeamBadge className="mt-1" />
              {user?.email && (
                <p className="text-xs text-text-tertiary truncate mt-0.5">{user.email}</p>
              )}
            </div>

            <Link
              to="/migrations"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-primary hover:text-blue-700 focus-visible:text-blue-700 hover:bg-bg-light transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              My Migrations
            </Link>

            <Link
              to="/change-password"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-text-primary hover:text-blue-700 focus-visible:text-blue-700 hover:bg-bg-light transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change password
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
export const Navbar: React.FC<NavbarProps> = ({ variant = 'default', showBack = false, hideAuthCta: hideAuth = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const scope = useAuthScope();
  const { accessToken, user } = useSession(scope);
  const logout = useAuthStore((s) => s.logout);
  const isLoggedIn = !!accessToken;
  // Once a pair is chosen the flow is the only way forward: Sign in / Get started would let a visitor wander off mid-order.
  const hideAuthCta = hideAuth && !isLoggedIn;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavLink = (href: string) => {
    setMobileOpen(false);
    goToSection(href.replace('#', ''), location.pathname, navigate);
  };

  // Real anchors: section links smooth-scroll on the home page (and fall back to the
  // hash URL if JS is off); Contact Us is a normal route link.
  const navLinks = (mobile: boolean) =>
    NAV_LINKS.map((link) => {
      const cls = mobile
        ? `px-3 py-2.5 text-sm font-semibold rounded-md hover:bg-bg-light hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${NAV_TEXT}`
        : `px-3 py-2 text-sm font-semibold rounded-md hover:underline underline-offset-4 decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${NAV_TEXT}`;
      return 'to' in link ? (
        <Link key={link.label} to={link.to} onClick={() => setMobileOpen(false)} className={cls}>{link.label}</Link>
      ) : (
        <a
          key={link.label}
          href={`/${link.href}`}
          onClick={(e) => { e.preventDefault(); handleNavLink(link.href); }}
          className={cls}
        >
          {link.label}
        </a>
      );
    });

  // Starting a migration means picking a pair first, so "Get started" goes to the pair list.
  const handleGetStarted = () => { setMobileOpen(false); handleNavLink('#pairs'); };
  // react-router stamps each entry with its position; idx 0 means this page was opened
  // directly (new tab, bookmark, refresh-in-place), where -1 would leave the app.
  const handleBack = () => (typeof window.history.state?.idx === 'number' && window.history.state.idx > 0 ? navigate(-1) : navigate('/'));
  const handleAdminBack = () => navigate('/');

  const handleMobileLogout = async () => {
    setMobileOpen(false);
    try { await authService.logout(); } catch { /* ignore */ }
    logout(scope);
    navigate(scope === 'admin' ? '/admin/login' : '/sign-in');
  };

  if (variant === 'admin') {
    return (
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/admin" className="flex items-center gap-2.5 flex-shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                <LogoMark />
                <span className="flex flex-col leading-tight">
                  <span className="font-bold text-blue-700 text-lg tracking-tight">Migration Hub</span>
                  <span className="text-[11px] text-text-primary">Powered by MMC Convert</span>
                </span>
              </Link>
              <div className="hidden sm:block w-px h-5 bg-border" aria-hidden="true" />
              <span className="hidden sm:inline text-text-secondary text-sm font-medium truncate">Admin Dashboard</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleAdminBack} className="flex-shrink-0">
              Back to Site
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // Default full navbar
  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        'bg-white', scrolled && 'shadow-card'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 flex-shrink-0">
            {showBack && (
              <>
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-text-primary hover:text-blue-700 focus-visible:text-blue-700 transition-colors text-sm rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="w-px h-5 bg-border" aria-hidden="true" />
              </>
            )}
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <LogoMark />
              <span className="flex flex-col leading-tight">
                  <span className="font-bold text-blue-700 text-lg tracking-tight">Migration Hub</span>
                  <span className="text-[11px] text-text-primary">Powered by MMC Convert</span>
                </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav aria-label="Main" className={'hidden lg:flex items-center gap-1'}>
            {navLinks(false)}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {/* Auth area (desktop) */}
            <div className={'hidden lg:flex items-center gap-1.5'}>
              {isLoggedIn ? (
                <UserMenu />
              ) : hideAuthCta ? null : (
                <>
                  <Link
                    to="/sign-in"
                    className="px-3 py-1.5 text-sm text-text-primary hover:text-blue-700 focus-visible:text-blue-700 rounded-md hover:bg-bg-light transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGetStarted}
                    iconRight={
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    }
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className={cn('p-2 rounded-md text-text-primary hover:text-blue-700 focus-visible:text-blue-700 hover:bg-bg-light transition-colors', 'lg:hidden')}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn('bg-white border-t border-border shadow-elevated', 'lg:hidden')}
        >
          <nav aria-label="Mobile" className="flex flex-col p-4 gap-1">
            {navLinks(true)}

            <div className="pt-2 border-t border-border mt-1 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {user ? `${user.firstname} ${user.lastname}`.trim() : 'My Account'}
                      </p>
                      <OperationTeamBadge />
                      {user?.email && (
                        <p className="text-xs text-text-tertiary">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/migrations"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm text-text-primary hover:text-blue-700 focus-visible:text-blue-700 rounded-md hover:bg-bg-light transition-colors font-medium"
                  >
                    My Migrations
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm text-text-primary hover:text-blue-700 focus-visible:text-blue-700 rounded-md hover:bg-bg-light transition-colors font-medium"
                  >
                    Change password
                  </Link>
                  <button
                    onClick={handleMobileLogout}
                    className="w-full px-3 py-2.5 text-sm text-center text-red-600 rounded-md border border-red-200 hover:bg-red-50 transition-colors font-medium"
                  >
                    Sign out
                  </button>
                </>
              ) : hideAuthCta ? null : (
                <>
                  <Link
                    to="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm text-center text-text-primary hover:text-blue-700 focus-visible:text-blue-700 rounded-md border border-border hover:bg-bg-light transition-colors font-medium"
                  >
                    Sign in
                  </Link>
                  <Button variant="primary" size="sm" fullWidth onClick={handleGetStarted}>
                    Get started free
                  </Button>
                </>
              )}
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
};

// ─── Logo Mark ────────────────────────────────────────────────────────────────
export const LogoMark: React.FC = () => (
  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  </div>
);
