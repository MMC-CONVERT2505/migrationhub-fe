import { describe, expect, it } from 'vitest';
import { resetErrorMessage, validateNewPassword } from '../password';

describe('validateNewPassword', () => {
  it('accepts a strong 8–16 char password', () => {
    expect(validateNewPassword('Abcdef#1')).toBeNull();
    expect(validateNewPassword('Abcdefghij#12345')).toBeNull();
  });
  it.each([
    ['Ab#1', /8–16/],
    ['Abcdefghij#123456', /8–16/],
    ['ABCDEFG#1', /lowercase/],
    ['abcdefg#1', /uppercase/],
    ['Abcdefg##', /number/],
    ['Abcdefg12', /special/],
  ])('rejects %s', (pw, msg) => {
    expect(validateNewPassword(pw)).toMatch(msg);
  });
});

describe('resetErrorMessage', () => {
  it('maps status codes to plain messages', () => {
    expect(resetErrorMessage({ statusCode: 429, message: 'x' })).toMatch(/Too many/);
    expect(resetErrorMessage({ statusCode: 500, message: 'x' })).toMatch(/shortly/);
    expect(resetErrorMessage({ statusCode: 0, message: 'Network down' })).toBe('Network down');
    expect(resetErrorMessage({ statusCode: 400, message: 'This reset link is invalid or has expired.' })).toMatch(/invalid or has expired/);
    expect(resetErrorMessage(new Error('boom'))).toMatch(/Something went wrong/);
  });
});
