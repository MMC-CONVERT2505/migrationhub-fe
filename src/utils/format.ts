import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Principal } from '@/types/api';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Primary label for an activity principal: email when known, else resolved name, else 'System'. */
export function principalLabel(p: Principal | null | undefined): string {
  if (!p) return 'System';
  return p.email ?? p.name;
}

/** Secondary label: the resolved name when an email is the primary label (and differs), else null. */
export function principalSubLabel(p: Principal | null | undefined): string | null {
  if (!p || !p.email) return null;
  return p.name && p.name !== p.email ? p.name : null;
}

/** Yes/No answer for display; null is a question that was never put to the customer. */
export function yesNo(value: boolean | null | undefined, unanswered = '—'): string {
  return value == null ? unanswered : value ? 'Yes' : 'No';
}

/**
 * Whole-unit price. No currency: "$389". With one, localised and unambiguous: "A$549", "£189", "₹35,000".
 * Prices are never shown with decimals.
 */
export function formatCurrency(amount: number, currency?: string): string {
  const whole = Math.round(amount);
  if (!currency) return `$${whole}`;
  try {
    // Indian customers read ₹1,25,000 (lakh grouping); the rest are unambiguous in en-US (A$549, £189, $389).
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(whole);
  } catch {
    return `${currency} ${whole.toLocaleString()}`;
  }
}

/** Kept for the pay button; identical to formatCurrency now that decimals are gone. */
export const formatCurrencyCompact = formatCurrency;

export function formatNumber(n: number | null | undefined): string {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return n.toLocaleString();
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural ?? `${singular}s`}`;
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
