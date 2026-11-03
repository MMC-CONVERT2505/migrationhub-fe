import { describe, expect, it } from 'vitest';
import { isPhoneRequiredRejection, operatorClaimIsStale } from '../sessionCheck';

describe('operatorClaimIsStale', () => {
  it('is stale when the token says Operation Team but the server no longer lists the role', () => {
    expect(operatorClaimIsStale(['OP_TEAM'], [])).toBe(true);
    expect(operatorClaimIsStale(['OP_TEAM'], ['DEVELOPER'])).toBe(true);
  });

  it('is fine while the server still lists the role', () => {
    expect(operatorClaimIsStale(['OP_TEAM'], ['OP_TEAM'])).toBe(false);
    expect(operatorClaimIsStale(['OP_TEAM'], [{ role: { name: 'OP_TEAM' } }])).toBe(false);
  });

  it('is never stale for someone the token does not call Operation Team', () => {
    expect(operatorClaimIsStale([], [])).toBe(false);
    expect(operatorClaimIsStale(undefined, ['OP_TEAM'])).toBe(false);
  });

  it('never acts when the server did not say (missing or malformed roles)', () => {
    expect(operatorClaimIsStale(['OP_TEAM'], undefined)).toBe(false);
    expect(operatorClaimIsStale(['OP_TEAM'], null)).toBe(false);
    expect(operatorClaimIsStale(['OP_TEAM'], 'OP_TEAM')).toBe(false);
  });
});

describe('isPhoneRequiredRejection', () => {
  it('matches the server rejecting a request for its missing phone', () => {
    expect(isPhoneRequiredRejection(400, 'Phone number is required.')).toBe(true);
    expect(isPhoneRequiredRejection(400, 'phone number is required')).toBe(true);
  });
  it('ignores every other failure', () => {
    expect(isPhoneRequiredRejection(400, 'Name is required.')).toBe(false);
    expect(isPhoneRequiredRejection(401, 'Phone number is required.')).toBe(false);
    expect(isPhoneRequiredRejection(500, 'Phone number is required.')).toBe(false);
    expect(isPhoneRequiredRejection(undefined, undefined)).toBe(false);
  });
});
