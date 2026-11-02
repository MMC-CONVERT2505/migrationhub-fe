import { describe, expect, it } from 'vitest';
import { OP_TEAM_INQUIRY_EMAIL, contactErrors, contactForSubmit, operatorPhoneRequired } from '../inquiryContact';

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

describe('inquiry contact — Operation Team on QBO → Xero', () => {
  it('only that pair needs an operator phone', () => {
    expect(operatorPhoneRequired({ src: 'qbo', dst: 'xero' })).toBe(true);
    expect(operatorPhoneRequired({ src: 'QBO', dst: ' Xero ' })).toBe(true);
    expect(operatorPhoneRequired({ src: 'xero', dst: 'qbo' })).toBe(false);
    expect(operatorPhoneRequired({ src: 'qbo', dst: 'myob' })).toBe(false);
    expect(operatorPhoneRequired(null)).toBe(false);
    expect(operatorPhoneRequired(undefined)).toBe(false);
  });
  it('says "Phone number is required." for a blank phone, and never asks for an email', () => {
    expect(contactErrors({ isOperator: true, operatorPhoneRequired: true, email: '', phone: '' })).toEqual([
      { field: 'phone', message: 'Phone number is required.' },
    ]);
    expect(contactErrors({ isOperator: true, operatorPhoneRequired: true, email: '', phone: '   ' }).map((e) => e.message)).toEqual(['Phone number is required.']);
  });
  it('rejects a malformed phone with the existing message', () => {
    expect(contactErrors({ isOperator: true, operatorPhoneRequired: true, email: '', phone: '12' })).toEqual([
      { field: 'phone', message: 'Enter a valid phone number.' },
    ]);
  });
  it('accepts a valid phone', () => {
    expect(contactErrors({ isOperator: true, operatorPhoneRequired: true, email: '', phone: '412 345 678' })).toEqual([]);
  });
  it('submits the shared inbox plus the phone', () => {
    expect(contactForSubmit({ isOperator: true, operatorPhoneRequired: true, email: 'me@x.com', phone: '0412 345 678', dialCode: '+61' }, national)).toEqual({
      email: 'preeti@mmcconvert.com',
      phone: '+61412345678',
    });
  });
  it('is ignored for customers and for operators on other pairs (unchanged)', () => {
    expect(contactErrors({ isOperator: true, operatorPhoneRequired: false, email: '', phone: '' })).toEqual([]);
    expect(contactForSubmit({ isOperator: true, operatorPhoneRequired: false, email: '', phone: '0412', dialCode: '+61' }, national)).toEqual({ email: 'preeti@mmcconvert.com' });
    expect(contactErrors({ isOperator: false, operatorPhoneRequired: true, email: '', phone: '' }).map((e) => e.field)).toEqual(['email', 'phone']);
  });
});
