import { ApiError } from '@/api/client';

export const BAD_CREDENTIALS_MESSAGE = 'Incorrect email or password. Please check them and try again.';

/**
 * What to tell someone whose sign-in failed, chosen by *why* it failed:
 *  - blocked / suspended account → the server's own message (the password isn't the problem);
 *  - not found / wrong password  → one generic line, so the form never reveals which emails exist;
 *  - too many attempts, server or network trouble → say so, instead of blaming the password;
 *  - anything else → the server's message.
 */
export function signInErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong. Please try again.';

  if (err.statusCode === 0) return err.message; // network / timeout — already user-facing

  if (err.statusCode === 401 || err.statusCode === 403 || err.statusCode === 404) {
    return /blocked|suspended|disabled|deactivated/i.test(err.message) ? err.message : BAD_CREDENTIALS_MESSAGE;
  }
  if (err.statusCode === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (err.statusCode >= 500) return "We couldn't sign you in right now. Please try again shortly.";
  if (err.errors?.length) return err.errors.join(' ');
  return err.message || 'Something went wrong. Please try again.';
}

/**
 * Where to send someone after signing in. Only a path inside this app is honoured: anything
 * else (another site, a protocol-relative `//host`, a backslash trick, `javascript:`) falls
 * back to home, so a crafted `?next=` link can't bounce a signed-in user to another origin.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
