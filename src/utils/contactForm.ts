import type { AuthError } from '@/types/auth';

export interface ContactFormData {
  name: string;
  email: string;
  dialCode: string;
  phone: string;
  companyName: string;
  country: string;
  message: string;
}

/** Mirrors the server's limits (create-contact.dto.ts). */
export const CONTACT_LIMITS = { name: 100, company: 100, email: 254, message: 2000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(form: ContactFormData): AuthError[] {
  const errs: AuthError[] = [];

  const name = form.name.trim();
  if (!name) errs.push({ field: 'name', message: 'Name is required.' });
  else if (name.length < 2) errs.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  else if (name.length > CONTACT_LIMITS.name) errs.push({ field: 'name', message: 'Name must be 100 characters or fewer.' });

  const email = form.email.trim();
  if (!email) errs.push({ field: 'email', message: 'Email is required.' });
  else if (email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) errs.push({ field: 'email', message: 'Please enter a valid email address.' });

  const company = form.companyName.trim();
  if (!company) errs.push({ field: 'companyName', message: 'Company name is required.' });
  else if (company.length < 2) errs.push({ field: 'companyName', message: 'Company name must be at least 2 characters.' });
  else if (company.length > CONTACT_LIMITS.company) errs.push({ field: 'companyName', message: 'Company name must be 100 characters or fewer.' });

  if (!form.country) errs.push({ field: 'country', message: 'Please select a country.' });

  // Phone is optional: only validated when something was entered.
  const phoneDigits = form.phone.replace(/[\s()-]/g, '');
  if (phoneDigits && !/^\d{6,15}$/.test(phoneDigits)) {
    errs.push({ field: 'phone', message: 'Please enter a valid phone number (6–15 digits).' });
  }

  const message = form.message.trim();
  if (!message) errs.push({ field: 'message', message: 'Please enter a message.' });
  else if (message.length > CONTACT_LIMITS.message) errs.push({ field: 'message', message: 'Message must be 2000 characters or fewer.' });

  return errs;
}
