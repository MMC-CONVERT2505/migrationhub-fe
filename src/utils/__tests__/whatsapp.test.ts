import { describe, expect, it } from 'vitest';
import { whatsappLink } from '../whatsapp';
import { CONTACT_PHONE } from '@/constants/links';

describe('whatsappLink', () => {
  it('builds the chat link for the site number (digits only, no plus)', () => {
    expect(whatsappLink('+919926477000')).toBe('https://wa.me/919926477000');
    expect(whatsappLink(CONTACT_PHONE)).toBe('https://wa.me/919926477000');
  });

  it('accepts the usual ways of writing an international number', () => {
    expect(whatsappLink('+91 99264 77000')).toBe('https://wa.me/919926477000');
    expect(whatsappLink('+91-9926-477-000')).toBe('https://wa.me/919926477000');
    expect(whatsappLink('+61 (402) 900 868')).toBe('https://wa.me/61402900868');
    expect(whatsappLink('0061402900868')).toBe('https://wa.me/61402900868');
    expect(whatsappLink('919926477000')).toBe('https://wa.me/919926477000');
    expect(whatsappLink('  +919926477000  ')).toBe('https://wa.me/919926477000');
  });

  it('refuses a local number: wa.me cannot guess the country and would reach the wrong person', () => {
    expect(whatsappLink('0412 345 678')).toBeNull();
    expect(whatsappLink('09926477000')).toBeNull();
  });

  it('refuses anything that is not a plausible phone number', () => {
    for (const bad of [null, undefined, '', '   ', 'call us', '+', '+1234', '12345', '+1234567890123456', '++91 99264 77000x']) {
      expect(whatsappLink(bad as string)).toBeNull();
    }
  });

  it('adds a pre-filled message only when asked, encoded safely', () => {
    expect(whatsappLink('+919926477000', 'Hi MMC')).toBe('https://wa.me/919926477000?text=Hi%20MMC');
    expect(whatsappLink('+919926477000', 'a&b=c #1')).toBe('https://wa.me/919926477000?text=a%26b%3Dc%20%231');
    expect(whatsappLink('+919926477000', '   ')).toBe('https://wa.me/919926477000');
  });

  it('never lets the number change the destination host', () => {
    expect(whatsappLink('+91@evil.com/99264')).toBeNull();
    expect(whatsappLink('https://evil.com')).toBeNull();
  });
});
