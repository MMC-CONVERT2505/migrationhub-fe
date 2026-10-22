import { describe, expect, it } from 'vitest';
import { OP_TEAM_INQUIRY_EMAIL, contactErrors, contactForSubmit } from '../inquiryContact';

const national = (t: string) => t.replace(/\D/g, '').replace(/^0+/, '');

describe('inquiry contact — Operation Team', () => {
  it('defaults the shared inbox to preeti@mmcconvert.com', () => {
    expect(OP_TEAM_INQUIRY_EMAIL).toBe('preeti@mmcconvert.com');
  });
  it('operator submits the shared inbox and no phone, whatever is in the boxes', () => {
    expect(contactForSubmit({ isOperator: true, email: 'me@x.com', phone: '0412 345 678', dialCode: '+61' }, national)).toEqual({ email: 'preeti@mmcconvert.com' });
  });
  it('operator has nothing to validate (blank email and phone are fine)', () => {
    expect(contactErrors({ isOperator: true, email: '', phone: '' })).toEqual([]);
  });
});

describe('inquiry contact — customer (unchanged rules)', () => {
  it('composes dial code + national number and trims the email', () => {
    expect(contactForSubmit({ isOperator: false, email: ' a@b.co ', phone: '0412 345 678', dialCode: '+61' }, national)).toEqual({ email: 'a@b.co', phone: '+61412345678' });
  });
  it('still requires a valid email and phone', () => {
    expect(contactErrors({ isOperator: false, email: '', phone: '' }).map((e) => e.field)).toEqual(['email', 'phone']);
    expect(contactErrors({ isOperator: false, email: 'bad', phone: '12' }).map((e) => e.field)).toEqual(['email', 'phone']);
    expect(contactErrors({ isOperator: false, email: 'a@b.co', phone: '412 345 678' })).toEqual([]);
  });
});
