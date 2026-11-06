/**
 * A wa.me chat link for a phone number, or null when the number cannot be used.
 * wa.me wants the full international number as digits only: no "+", spaces, dashes, brackets or leading "00", and it
 * cannot guess a country, so a local number such as "0412 345 678" would open a chat with the wrong person (or nobody).
 * Returning null lets the caller leave the link out instead of rendering one that does not work.
 */
export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  const raw = (phone ?? '').trim();
  // Only digits and the usual separators, with at most one leading "+": no letters, no stray symbols.
  if (!/^\+?[\d\s().-]+$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, '');
  const international = raw.startsWith('+') ? digits : raw.startsWith('00') ? digits.slice(2) : digits;
  // E.164 numbers are 8-15 digits and never start with 0 (a leading 0 means a local, country-less number).
  if (!/^[1-9]\d{7,14}$/.test(international)) return null;
  const message = text?.trim();
  return `https://wa.me/${international}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
