import React, { useState } from 'react';
import { cn } from '@/utils/format';
import { PLATFORM_LOGOS, PLATFORM_KEY, PLATFORM_COLORS, PLATFORM_ABBR } from '@/constants/logos';
import type { PlatformLogoProps } from '@/types';

export const PlatformLogo: React.FC<PlatformLogoProps> = ({
  platformName,
  size = 'md',
  className,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const key = PLATFORM_KEY[platformName] ?? platformName.toLowerCase();
  const logoSrc = PLATFORM_LOGOS[key];
  const color = PLATFORM_COLORS[platformName] ?? '#4b5568';
  const abbr = PLATFORM_ABBR[platformName] ?? platformName.slice(0, 2).toUpperCase();

  if (logoSrc && !imgError) {
    return (
      <img
        src={logoSrc}
        alt={platformName}
        onError={() => setImgError(true)}
        className={cn(
          sizeClasses[size],
          'rounded-lg object-contain bg-white border border-border p-1',
          className
        )}
      />
    );
  }

  // Fallback: styled div with initials
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-bold font-mono text-white flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      title={platformName}
    >
      {abbr}
    </div>
  );
};
