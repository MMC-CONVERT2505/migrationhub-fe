/** Mirrors the server's rule for a new password (6–16 chars, upper, lower, number, symbol); the site asks for 8+. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;

export function validateNewPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX)
    return `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`;
  if (!/[a-z]/.test(password)) return 'Password needs at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password needs at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password needs at least one number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password needs at least one special character.';
  return null;
}

/** What to tell someone whose reset request or confirmation failed. */
export function resetErrorMessage(err: unknown, fallbackInvalid = 'This reset link is invalid or has expired.'): string {
  const e = err as { statusCode?: number; message?: string; errors?: string[] } | null;
  if (!e || typeof e.statusCode !== 'number') return 'Something went wrong. Please try again.';
  if (e.statusCode === 0) return e.message || 'Network problem. Please check your connection and try again.';
  if (e.statusCode === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (e.statusCode >= 500) return "We couldn't complete that right now. Please try again shortly.";
  if (e.statusCode === 400) return e.errors?.length ? e.errors.join(' ') : e.message || fallbackInvalid;
  return e.message || 'Something went wrong. Please try again.';
}
