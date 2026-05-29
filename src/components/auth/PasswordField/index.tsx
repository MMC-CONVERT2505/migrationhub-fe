import React, { useState, useMemo } from 'react';
import { cn } from '@/utils/format';
import { InputField } from '@/components/auth/InputField';
import type { PasswordStrength, PasswordRequirement } from '@/types/auth';

interface PasswordFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  /** Show strength meter below the field */
  showStrength?: boolean;
  id?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

function getRequirements(password: string): PasswordRequirement[] {
  return [
    { label: 'At least 8 characters',          met: password.length >= 8 },
    { label: 'One uppercase letter',             met: /[A-Z]/.test(password) },
    { label: 'One number',                       met: /[0-9]/.test(password) },
    { label: 'One special character',            met: /[^A-Za-z0-9]/.test(password) },
  ];
}

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  weak:   { label: 'Weak',   color: 'bg-red-500',   bars: 1 },
  fair:   { label: 'Fair',   color: 'bg-amber-500', bars: 2 },
  good:   { label: 'Good',   color: 'bg-blue-500',  bars: 3 },
  strong: { label: 'Strong', color: 'bg-green-500', bars: 4 },
};

// ─── Show / Hide icon ─────────────────────────────────────────────────────────

const EyeIcon: React.FC<{ open: boolean }> = ({ open }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

// ─── Component ────────────────────────────────────────────────────────────────

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label = 'Password',
  value,
  onChange,
  error,
  placeholder = '••••••••',
  required,
  showStrength = false,
  id,
}) => {
  const [visible, setVisible] = useState(false);

  const strength = useMemo(() => getStrength(value), [value]);
  const requirements = useMemo(() => getRequirements(value), [value]);
  const config = STRENGTH_CONFIG[strength];
  const showMeter = showStrength && value.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <InputField
        id={id}
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        error={error}
        autoComplete={showStrength ? 'new-password' : 'current-password'}
        suffix={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-text-tertiary hover:text-text-secondary transition-colors focus:outline-none"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={visible} />
          </button>
        }
      />

      {/* Strength meter */}
      {showMeter && (
        <div className="mt-1">
          {/* Bar segments */}
          <div className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  bar <= config.bars ? config.color : 'bg-bg-muted'
                )}
              />
            ))}
            <span
              className={cn(
                'ml-2 text-[10px] font-semibold min-w-[36px]',
                strength === 'weak'   && 'text-red-600',
                strength === 'fair'   && 'text-amber-600',
                strength === 'good'   && 'text-blue-600',
                strength === 'strong' && 'text-green-600',
              )}
            >
              {config.label}
            </span>
          </div>

          {/* Requirements list */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {requirements.map((req) => (
              <li key={req.label} className={cn('flex items-center gap-1.5 text-[11px]', req.met ? 'text-green-600' : 'text-text-tertiary')}>
                {req.met ? (
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
                )}
                {req.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
