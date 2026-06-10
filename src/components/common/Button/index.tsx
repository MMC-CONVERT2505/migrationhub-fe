import React from 'react';
import { cn } from '@/utils/format';
import type { ButtonProps } from '@/types';
import { Spinner } from '@/components/common/Spinner';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500 shadow-sm',
      secondary:
        'bg-white text-text-primary border border-border hover:border-border-medium hover:bg-bg-light active:bg-bg-lighter focus-visible:ring-blue-500',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-bg-light active:bg-bg-lighter focus-visible:ring-blue-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Spinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-blue-600'} />
        ) : (
          icon
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = 'Button';
