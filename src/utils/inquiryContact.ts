/**
 * Shared team inbox every Operation Team inquiry uses (order info and tracker links land there).
 * Display and pre-fill only: the server substitutes it itself and ignores whatever the client sends.
 */
export const OP_TEAM_INQUIRY_EMAIL: string =
  (import.meta.env.VITE_OP_TEAM_INQUIRY_EMAIL as string | undefined)?.trim() || 'preeti@mmcconvert.com';

export interface ContactInput {
  isOperator: boolean;
  email: string;
  /** Raw phone-number box contents (national number). */
  phone: string;
  dialCode: string;
}

/** What the form submits: operators get the shared inbox and no phone; customers get what they typed. */
export function contactForSubmit(
  c: ContactInput,
  toNational: (typed: string) => string,
): { email: string; phone?: string } {
  if (c.isOperator) return { email: OP_TEAM_INQUIRY_EMAIL };
  return { email: c.email.trim(), phone: `${c.dialCode}${toNational(c.phone)}` };
}

/** Email/phone problems, if any. Operators have neither field to fill, so nothing to check. */
export function contactErrors(c: Pick<ContactInput, 'isOperator' | 'email' | 'phone'>): { field: 'email' | 'phone'; message: string }[] {
  if (c.isOperator) return [];
  const errs: { field: 'email' | 'phone'; message: string }[] = [];
  if (!c.email.trim()) errs.push({ field: 'email', message: 'Email is required.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errs.push({ field: 'email', message: 'Enter a valid email address.' });
  if (!c.phone.trim()) errs.push({ field: 'phone', message: 'Phone number is required.' });
  else if (!/^\+?[0-9\s()-]{6,20}$/.test(c.phone.trim())) errs.push({ field: 'phone', message: 'Enter a valid phone number.' });
  return errs;
}
