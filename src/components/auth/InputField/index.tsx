import React from 'react';
import { cn } from '@/utils/format';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Icon placed on the left side of the input */
  iconLeft?: React.ReactNode;
  /** Element placed on the right side (e.g. show/hide toggle) */
  suffix?: React.ReactNode;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, iconLeft, suffix, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left icon */}
          {iconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {iconLeft}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full py-2.5 text-sm bg-white border rounded-lg text-text-primary',
              'placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
              'transition-colors duration-150',
              'disabled:bg-gray-100 disabled:text-text-tertiary disabled:cursor-not-allowed disabled:hover:border-border',
              iconLeft  ? 'pl-9 pr-3' : 'px-3',
              suffix    ? 'pr-10' : '',
              error
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                : 'border-border hover:border-border-medium',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />

          {/* Right suffix */}
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {/* Hint */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">{hint}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = 'InputField';
