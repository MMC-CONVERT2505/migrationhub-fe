import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Shown in the blue brand panel */
  heading?: string;
  subheading?: string;
}

// ─── Testimonial shown in the brand panel ────────────────────────────────────
const TESTIMONIAL = {
  quote:
    '"MMC Convert moved our entire 4-year Xero history into QuickBooks Online overnight. Every transaction balanced perfectly. Incredible product."',
  author: 'Sarah M.',
  role: 'Partner, Meridian Accounting Group',
  rating: 5,
};

const STATS = [
  { value: '100,000+', label: 'Migrations completed' },
  { value: '99.8%',    label: 'Data accuracy rate' },
  { value: '500+',     label: 'Accounting firms' },
];

// ─── Logo Mark (reusable) ─────────────────────────────────────────────────────
export const LogoMark: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' }[size];
  const ic = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }[size];
  return (
    <div className={`${s} bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0`}>
      <svg className={`${ic} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </div>
  );
};

// ─── Stars ────────────────────────────────────────────────────────────────────
const Stars: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

// ─── Auth Layout ─────────────────────────────────────────────────────────────

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  heading = 'Migrate your accounting data with confidence',
  subheading = 'Join 500+ accounting firms who trust MMC Convert for accurate, stress-free platform migrations.',
}) => (
  <div className="min-h-screen flex bg-bg">
    {/* ── Left brand panel (hidden on small screens) ── */}
    <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] bg-gradient-to-br from-[#1e3a8a] to-[#1d4ed8] flex-col justify-between p-10 xl:p-14 relative overflow-hidden flex-shrink-0">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top: logo + heading */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 mb-12">
          <LogoMark size="lg" />
          <span className="text-xl font-bold text-white tracking-tight">Migration Hub</span>
        </Link>

        <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
          {heading}
        </h2>
        <p className="text-blue-200 text-base leading-relaxed max-w-sm">{subheading}</p>
      </div>

      {/* Middle: stats */}
      <div className="relative z-10 grid grid-cols-3 gap-4 my-10">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/10">
            <p className="text-2xl font-bold text-white tracking-tight">{s.value}</p>
            <p className="text-xs text-blue-200 mt-1 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom: testimonial */}
      <div className="relative z-10 bg-white/10 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
        <Stars count={TESTIMONIAL.rating} />
        <p className="text-sm text-white leading-relaxed mt-3 mb-4 italic">{TESTIMONIAL.quote}</p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-400/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {TESTIMONIAL.author[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{TESTIMONIAL.author}</p>
            <p className="text-xs text-blue-200">{TESTIMONIAL.role}</p>
          </div>
        </div>
      </div>
    </div>

    {/* ── Right: form area ── */}
    <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
      {/* Mobile logo bar */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border bg-white">
        <Link to="/" className="inline-flex items-center gap-2">
          <LogoMark size="sm" />
          <span className="font-bold text-text-primary tracking-tight">Migration Hub</span>
        </Link>
        <Link to="/" className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">
          ← Back to site
        </Link>
      </div>

      {/* Form column centred */}
      <div className="flex-1 flex items-center justify-center py-10 px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border text-center">
        <p className="text-xs text-text-tertiary">
          © {new Date().getFullYear()} MMC Convert ·{' '}
          <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
          {' · '}
          <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
          {' · '}
          <a href="#" className="hover:text-text-secondary transition-colors">Support</a>
        </p>
      </div>
    </div>
  </div>
);
