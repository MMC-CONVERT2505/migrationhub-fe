import React, { useState } from 'react';
import { cn } from '@/utils/format';

interface PlatformMarkProps {
  /** Brand logo URL; when absent or it fails to load, the abbr mark shows. */
  logo?: string | null;
  /** Fallback abbreviation, e.g. "QBO". */
  abbr: string;
  /** Fallback background colour for the abbr mark. */
  color: string;
  /** Accessible name / alt text, e.g. "QuickBooks Online". */
  name: string;
  /** Size + shape classes for the square container. */
  className?: string;
  /** Font-size class for the abbr fallback text. */
  textClassName?: string;
  /**
   * When true, the logo renders as a bare, size-to-fit image with no white
   * container box/border/padding — so the brand mark reads bigger and cleaner.
   * The coloured abbr tile is still shown when the logo is missing or errors.
   */
  bare?: boolean;
}

/**
 * Renders a migration platform's brand logo, falling back to a coloured
 * abbreviation tile when no logo is set or the image fails to load.
 */
export const PlatformMark: React.FC<PlatformMarkProps> = ({
  logo,
  abbr,
  color,
  name,
  className = 'w-12 h-12 rounded-xl',
  textClassName = 'text-base',
  bare = false,
}) => {
  const [failed, setFailed] = useState(false);
  const showLogo = !!logo && !failed;

  if (showLogo) {
    if (bare) {
      return (
        <img
          src={logo as string}
          alt={name}
          title={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('object-contain flex-shrink-0', className)}
        />
      );
    }
    return (
      <div
        className={cn(
          'flex items-center justify-center flex-shrink-0 bg-white border border-border overflow-hidden p-1.5',
          className,
        )}
      >
        <img
          src={logo as string}
          alt={name}
          title={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 text-white font-bold font-mono',
        textClassName,
        className,
      )}
      style={{ backgroundColor: color }}
      title={name}
    >
      {abbr}
    </div>
  );
};
