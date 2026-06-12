import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/format';
import { Button } from '@/components/common/Button';
import { PlatformMark } from '@/components/common/PlatformMark';
import type { Pair } from '@/types';

interface ConnectStepProps {
  /** 'source' shows src platform info; 'destination' shows dst platform info */
  role: 'source' | 'destination';
  pair: Pair;
  onNext: () => void;
  onBack?: () => void;
}

const REGIONS = ['Australia', 'New Zealand', 'United Kingdom', 'United States', 'India', 'UAE', 'Singapore', 'Other'];
const FY_ENDS  = ['30 June', '31 March', '31 December', '31 January'];
const PLANS    = ['Standard', 'Premium', 'Enterprise'];

const INPUT = cn(
  'w-full px-3 py-2.5 text-sm bg-bg-light border border-border rounded-lg text-text-primary',
  'placeholder:text-text-tertiary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors'
);

export const ConnectStep: React.FC<ConnectStepProps> = ({ role, pair, onNext, onBack }) => {
  const isSource = role === 'source';
  const platform = isSource ? pair.src : pair.dst;
  const color    = isSource ? pair.srcColor : pair.dstColor;
  const abbr     = isSource ? pair.srcAbbr  : pair.dstAbbr;
  const logo     = isSource ? pair.srcLogo  : pair.dstLogo;
  const stepNum  = isSource ? 1 : 2;

  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      onNext();
    }, 1200);
  };

  return (
    <motion.div
      key={role}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="animate-panel-enter"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {isSource ? 'Connect source account' : 'Connect destination account'}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {isSource
            ? 'We use OAuth and request read-only access — your password is never stored.'
            : 'Write access is scoped only to the data categories you select in the next step.'}
        </p>
      </div>

      {/* Connect card */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-card">
        {/* Card header */}
        <div className="flex items-start gap-4 p-6 border-b border-border">
          <PlatformMark
            logo={logo}
            abbr={abbr}
            color={color}
            name={platform}
            textClassName="text-sm font-extrabold"
          />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Connect {platform}</h3>
            <p className="mt-1 text-xs text-text-secondary">
              {isSource
                ? `Authorise read-only API access to retrieve your ${platform} records.`
                : `Authorise write API access to receive records into your ${platform} account.`}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Organisation / Company name
              </label>
              <input type="text" className={INPUT} placeholder="Acme Accounting Pty Ltd" />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Account email
              </label>
              <input type="email" className={INPUT} placeholder="admin@acme.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Region / Country
              </label>
              <select className={INPUT}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {isSource ? 'Financial year end' : 'Subscription plan'}
              </label>
              <select className={INPUT}>
                {(isSource ? FY_ENDS : PLANS).map((opt) => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-bg-light">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {isSource
              ? 'OAuth 2.0 · Read-only · Credentials never stored'
              : 'Write access limited to selected categories only'}
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={connecting}
            onClick={handleConnect}
            style={{ backgroundColor: color, border: 'none' }}
          >
            {connecting ? 'Connecting…' : `Connect ${platform}`}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      {stepNum > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <span className="text-xs text-text-tertiary font-mono">
            Step {stepNum} of 5 · Source verified
          </span>
        </div>
      )}
    </motion.div>
  );
};
