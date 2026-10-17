import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { BAD_CREDENTIALS_MESSAGE, safeNextPath, signInErrorMessage } from '../authErrors';

describe('signInErrorMessage', () => {
  it('uses one generic line for a wrong password or unknown user (no account enumeration)', () => {
    expect(signInErrorMessage(new ApiError(401, 'Incorrect password.'))).toBe(BAD_CREDENTIALS_MESSAGE);
    expect(signInErrorMessage(new ApiError(401, 'User not found.'))).toBe(BAD_CREDENTIALS_MESSAGE);
    expect(signInErrorMessage(new ApiError(404, 'Not found'))).toBe(BAD_CREDENTIALS_MESSAGE);
  });

  it('does not blame the password for a blocked or suspended account', () => {
    const blocked = 'Your account is blocked. Please contact support.';
    const suspended = 'Your account is suspended. Please contact support.';
    expect(signInErrorMessage(new ApiError(401, blocked))).toBe(blocked);
    expect(signInErrorMessage(new ApiError(401, suspended))).toBe(suspended);
  });

  it('explains rate limiting and server trouble', () => {
    expect(signInErrorMessage(new ApiError(429, 'ThrottlerException'))).toMatch(/too many attempts/i);
    expect(signInErrorMessage(new ApiError(500, 'Internal server error'))).toMatch(/right now/i);
    expect(signInErrorMessage(new ApiError(503, 'x'))).toMatch(/right now/i);
  });

  it('passes network errors through, and joins validation errors', () => {
    expect(signInErrorMessage(new ApiError(0, 'Network error. Check your connection and try again.')))
      .toBe('Network error. Check your connection and try again.');
    expect(signInErrorMessage(new ApiError(400, 'x', ['a is required.', 'b is required.']))).toBe('a is required. b is required.');
    expect(signInErrorMessage(new ApiError(400, 'Both identifier and password are required.')))
      .toBe('Both identifier and password are required.');
  });

  it('falls back for non-API errors', () => {
    expect(signInErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});

describe('safeNextPath', () => {
  it('keeps in-app paths, including query and hash', () => {
    expect(safeNextPath('/migration/qbo-to-xero/plan?plan=Basic#x')).toBe('/migration/qbo-to-xero/plan?plan=Basic#x');
    expect(safeNextPath('/')).toBe('/');
  });
  it('rejects anything that could leave the site', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'evil.com', '/a\nb']) {
      expect(safeNextPath(bad)).toBe('/');
    }
  });
  it('falls back when missing', () => {
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath('', '/migrations')).toBe('/migrations');
  });
});
