import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAppStore } from '@/store/appStore';

interface NavbarProps {
  variant?: 'default' | 'payment' | 'migration' | 'admin';
}

const NAV_LINKS = [
  { label: 'Migrations', href: '#pairs' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Why MMC', href: '#why' },
  { label: 'Reviews', href: '#reviews' },
];

export const Navbar: React.FC<NavbarProps> = ({ variant = 'default' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const resetMigration = useAppStore((s) => s.resetMigration);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavLink = (href: string) => {
    setMobileOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(href.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const el = document.getElementById(href.replace('#', ''));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGetStarted = () => {
    navigate('/payment');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAdminBack = () => {
    navigate('/');
  };

  if (variant === 'payment') {
    return (
      <header
        className={cn(
          'sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b transition-shadow duration-200',
          scrolled ? 'border-border shadow-card' : 'border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="w-px h-5 bg-border" />
              <Link to="/" className="flex items-center gap-2">
                <LogoMark />
                <span className="font-bold text-text-primary text-lg tracking-tight">MMC Convert</span>
              </Link>
            </div>
            <Badge variant="success">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Checkout
            </Badge>
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'migration') {
    return (
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="font-bold text-text-primary text-lg tracking-tight">MMC Convert</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Save &amp; Exit
            </Button>
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'admin') {
    return (
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <LogoMark />
                <span className="font-bold text-text-primary text-lg tracking-tight">MMC Convert</span>
              </Link>
              <div className="w-px h-5 bg-border" />
              <span className="text-text-secondary text-sm font-medium">Admin Dashboard</span>
              <Badge variant="error" className="animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Live
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              >
                Export CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAdminBack}>
                Back to Site
              </Button>
            </div>
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
        scrolled
          ? 'bg-white/95 backdrop-blur-sm border-b border-border shadow-card'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <LogoMark />
            <span className="font-bold text-text-primary text-lg tracking-tight">
              MMC Convert
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavLink(link.href)}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-light transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/admin"
              className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-light transition-colors"
            >
              Admin
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-tertiary">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>81 migrations live</span>
            </div>
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

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-light transition-colors"
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
          className="md:hidden bg-white border-t border-border shadow-elevated"
        >
          <nav className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavLink(link.href)}
                className="px-3 py-2.5 text-sm text-left text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-light transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-bg-light transition-colors"
            >
              Admin
            </Link>
            <div className="pt-2 border-t border-border mt-1">
              <Button variant="primary" size="sm" fullWidth onClick={handleGetStarted}>
                Get started
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </header>
  );
};

// ─── Logo Mark Component ──────────────────────────────────────────────────────

const LogoMark: React.FC = () => (
  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  </div>
);
