import { describe, expect, it } from 'vitest';
import { validateContact, type ContactFormData } from '../contactForm';

const ok: ContactFormData = {
  name: 'Jane Doe',
  email: 'jane@company.com',
  dialCode: '+61',
  phone: '',
  companyName: 'Acme Pty Ltd',
  country: 'Australia',
  message: 'We would like to move from QuickBooks Online to Xero.',
};
const fields = (f: Partial<ContactFormData>) => validateContact({ ...ok, ...f }).map((e) => e.field);

describe('contact form validation', () => {
  it('accepts a complete form, phone left blank', () => {
    expect(validateContact(ok)).toEqual([]);
  });

  it('requires the name, trimmed', () => {
    expect(fields({ name: '' })).toEqual(['name']);
    expect(fields({ name: '   ' })).toEqual(['name']);
    expect(fields({ name: 'J' })).toEqual(['name']);
    expect(fields({ name: 'x'.repeat(101) })).toEqual(['name']);
  });

  it('requires a message, trimmed, up to 2000 characters', () => {
    expect(fields({ message: '' })).toEqual(['message']);
    expect(fields({ message: '  \n  ' })).toEqual(['message']);
    expect(fields({ message: 'x'.repeat(2000) })).toEqual([]);
    expect(fields({ message: 'x'.repeat(2001) })).toEqual(['message']);
  });

  it('counts a message made of padding as empty, not as long', () => {
    expect(fields({ message: ' '.repeat(3000) })).toEqual(['message']);
  });

  it('keeps the existing rules for email, company, country and phone', () => {
    expect(fields({ email: 'bad' })).toEqual(['email']);
    expect(fields({ companyName: 'A' })).toEqual(['companyName']);
    expect(fields({ country: '' })).toEqual(['country']);
    expect(fields({ phone: '12' })).toEqual(['phone']);
    expect(fields({ phone: '412 345 678' })).toEqual([]);
  });

  it('reports every problem on an empty form', () => {
    expect(validateContact({ ...ok, name: '', email: '', companyName: '', country: '', message: '' }).map((e) => e.field)).toEqual([
      'name', 'email', 'companyName', 'country', 'message',
    ]);
  });
});
