import React from 'react';
import type { ErrorCategory, ErrorGroupStatus, ErrorSeverity } from '@/api/adminErrorLogs';

export const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const ago = (d?: string | null) => {
  if (!d) return '—';
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const SEVERITY_META: Record<ErrorSeverity, string> = {
  WARN: 'bg-amber-50 text-amber-700',
  ERROR: 'bg-red-50 text-red-700',
  CRITICAL: 'bg-red-600 text-white',
};

export const CATEGORY_META: Record<ErrorCategory, string> = {
  DATA: 'bg-blue-50 text-blue-700',
  API: 'bg-purple-50 text-purple-700',
  AUTH: 'bg-orange-50 text-orange-700',
  TECH: 'bg-gray-100 text-text-secondary',
  INFRA: 'bg-teal-50 text-teal-700',
};

export const GROUP_STATUS_META: Record<ErrorGroupStatus, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-red-50 text-red-700' },
  RESOLVED: { label: 'Resolved', className: 'bg-green-50 text-green-700' },
  MUTED: { label: 'Muted', className: 'bg-gray-100 text-text-secondary' },
};

export const Badge: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${className}`}>
    {children}
  </span>
);

/** Right-pointing when closed, down when open — the usual expand/collapse cue. */
export const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    aria-hidden="true"
    className={`w-4 h-4 flex-shrink-0 text-text-secondary transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/** "20 errors" / "1 error". */
export const countLabel = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;
