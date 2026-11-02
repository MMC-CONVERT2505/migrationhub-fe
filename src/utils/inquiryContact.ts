/**
 * Shared team inbox every Operation Team inquiry uses (order info and tracker links land there).
 * Display and pre-fill only: the server substitutes it itself and ignores whatever the client sends.
 */
export const OP_TEAM_INQUIRY_EMAIL: string =
  (import.meta.env.VITE_OP_TEAM_INQUIRY_EMAIL as string | undefined)?.trim() || 'preeti@mmcconvert.com';

/** Pairs whose Operation Team orders must still give a phone number (mirrors the server rule). */
const PHONE_REQUIRED_PAIRS: ReadonlyArray<readonly [string, string]> = [['qbo', 'xero']];

export const operatorPhoneRequired = (pair: { src?: string; dst?: string } | null | undefined): boolean =>
  !!pair &&
  PHONE_REQUIRED_PAIRS.some(
    ([s, d]) => (pair.src ?? '').trim().toLowerCase() === s && (pair.dst ?? '').trim().toLowerCase() === d,
  );

export interface ContactInput {
  isOperator: boolean;
  /** Operator on a pair that needs a phone: the phone box is live and required. Ignored for customers. */
  operatorPhoneRequired?: boolean;
  email: string;
  /** Raw phone-number box contents (national number). */
  phone: string;
  dialCode: string;
}

/** What the form submits: operators get the shared inbox (and a phone only where the pair needs one); customers get what they typed. */
export function contactForSubmit(
  c: ContactInput,
  toNational: (typed: string) => string,
): { email: string; phone?: string } {
  if (c.isOperator) {
    return c.operatorPhoneRequired
      ? { email: OP_TEAM_INQUIRY_EMAIL, phone: `${c.dialCode}${toNational(c.phone)}` }
      : { email: OP_TEAM_INQUIRY_EMAIL };
  }
  return { email: c.email.trim(), phone: `${c.dialCode}${toNational(c.phone)}` };
}

/** Email/phone problems, if any. Operators have no email to fill, and a phone only on the pairs that need one. */
export function contactErrors(c: Pick<ContactInput, 'isOperator' | 'email' | 'phone' | 'operatorPhoneRequired'>): { field: 'email' | 'phone'; message: string }[] {
  if (c.isOperator && !c.operatorPhoneRequired) return [];
  const errs: { field: 'email' | 'phone'; message: string }[] = [];
  if (c.isOperator) {
    // The shared inbox is substituted for them, so only the phone is checked.
  } else if (!c.email.trim()) errs.push({ field: 'email', message: 'Email is required.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errs.push({ field: 'email', message: 'Enter a valid email address.' });
  if (!c.phone.trim()) errs.push({ field: 'phone', message: 'Phone number is required.' });
  else if (!/^\+?[0-9\s()-]{6,20}$/.test(c.phone.trim())) errs.push({ field: 'phone', message: 'Enter a valid phone number.' });
  return errs;
}
