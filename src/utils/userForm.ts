/** Dial codes offered when editing a user's mobile number. */
export const DIAL_CODES = ['+61', '+64', '+44', '+1', '+65', '+91', '+971', '+27'] as const;

export interface EditableUser {
  firstname: string;
  lastname: string;
  email: string;
  username?: string | null;
  mobile?: string | null;
  dialCode?: string | null;
}

export interface UserFormValues {
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  dialCode: string;
  /** National number, without the dial code. */
  mobile: string;
}

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

// The same rules the API enforces (UpdateProfileDetailsRequestDto), so mistakes show beside the field.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;
const MOBILE_RE = /^\d{6,15}$/;

/** "+61412345678" with dial code "+61" → "412345678". Falls back to the digits as stored. */
export function nationalNumber(mobile: string | null | undefined, dialCode: string | null | undefined): string {
  const m = (mobile ?? '').replace(/[\s()-]/g, '');
  if (!m) return '';
  if (dialCode && m.startsWith(dialCode)) return m.slice(dialCode.length);
  return m.replace(/^\+/, '');
}

export function toFormValues(u: EditableUser): UserFormValues {
  const dialCode = u.dialCode || DIAL_CODES[0];
  return {
    firstname: u.firstname ?? '',
    lastname: u.lastname ?? '',
    email: u.email ?? '',
    username: u.username ?? '',
    dialCode,
    mobile: nationalNumber(u.mobile, u.dialCode),
  };
}

const composeMobile = (v: UserFormValues): string => (v.mobile.trim() ? `${v.dialCode}${v.mobile.replace(/\s/g, '')}` : '');

/**
 * Field errors for an edit. The username is only checked when it was actually changed: accounts
 * created in bulk use their email as username, which the username rule would reject, and an
 * unchanged value is never sent to the API anyway.
 */
export function validateUserEdit(v: UserFormValues, original: EditableUser): UserFormErrors {
  const e: UserFormErrors = {};
  const first = v.firstname.trim();
  const last = v.lastname.trim();
  if (first.length < 2 || first.length > 50) e.firstname = 'First name must be 2–50 characters.';
  if (last.length < 2 || last.length > 50) e.lastname = 'Last name must be 2–50 characters.';
  if (!v.email.trim()) e.email = 'Email is required.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  const username = v.username.trim();
  if (username !== (original.username ?? '') && !USERNAME_RE.test(username)) {
    e.username = username
      ? 'Start with a letter; 3–30 letters, numbers, - or _ only.'
      : 'Username can’t be cleared.';
  }
  if (v.mobile.trim() && !MOBILE_RE.test(v.mobile.replace(/\s/g, ''))) e.mobile = 'Enter 6–15 digits, without the dial code.';
  return e;
}

export interface UserUpdatePayload {
  firstname: string;
  lastname: string;
  email: string;
  username?: string;
  mobile?: string;
  dialCode?: string;
}

/**
 * The PATCH body, or null when nothing changed. firstname/lastname/email are always sent (the API
 * requires them); username and mobile only when they changed, so an untouched legacy value is
 * never re-validated. An emptied mobile is sent as '' — the API's way of clearing it.
 */
export function buildUserUpdate(v: UserFormValues, original: EditableUser): UserUpdatePayload | null {
  const next = {
    firstname: v.firstname.trim(),
    lastname: v.lastname.trim(),
    email: v.email.trim().toLowerCase(),
  };
  const username = v.username.trim();
  const mobile = composeMobile(v);
  const originalMobile = (original.mobile ?? '').replace(/[\s()-]/g, '');

  const usernameChanged = username !== (original.username ?? '');
  const mobileChanged = mobile !== originalMobile;
  const basicsChanged =
    next.firstname !== original.firstname.trim() ||
    next.lastname !== original.lastname.trim() ||
    next.email !== (original.email ?? '').trim().toLowerCase();

  if (!basicsChanged && !usernameChanged && !mobileChanged) return null;
  return {
    ...next,
    ...(usernameChanged && { username }),
    ...(mobileChanged && { mobile, ...(mobile && { dialCode: v.dialCode }) }),
  };
}

/** Which form field a server error (409/400) belongs to, from its message. */
export function fieldForServerError(message: string): keyof UserFormValues | null {
  const m = message.toLowerCase();
  if (m.includes('email')) return 'email';
  if (m.includes('username')) return 'username';
  if (m.includes('mobile') || m.includes('dial code')) return 'mobile';
  return null;
}
