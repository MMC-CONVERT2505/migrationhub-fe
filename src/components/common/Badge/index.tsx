import React from 'react';
import { cn } from '@/utils/format';
import type { BadgeProps } from '@/types';

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const variants = {
    default:
      'bg-bg-lighter text-text-secondary border border-border',
    success:
      'bg-green-light text-green-700 border border-green-200',
    warning:
      'bg-amber-50 text-amber-700 border border-amber-200',
    error:
      'bg-red-50 text-red-700 border border-red-200',
    info:
      'bg-blue-50 text-blue-700 border border-blue-200',
    blue:
      'bg-blue-light text-blue-700 border border-blue-200',
    green:
      'bg-green-light text-green-700 border border-green-200',
    gray:
      'bg-bg-lighter text-text-secondary border border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
