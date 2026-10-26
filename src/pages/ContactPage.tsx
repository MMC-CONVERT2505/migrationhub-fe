import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { InputField } from '@/components/auth/InputField';
import { Button } from '@/components/common/Button';
import { contactService } from '@/api/contact';
import { ApiError } from '@/api/client';
import type { AuthError } from '@/types/auth';
import { CONTACT_EMAIL } from '@/constants/links';
import { COUNTRY_NAMES, DIAL_CODE_BY_NAME } from '@/constants/countries';

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = [...COUNTRY_NAMES, 'Other'];

const DIAL_CODES: { label: string; value: string }[] = [
  { label: '+61', value: '+61' },   // AU
  { label: '+64', value: '+64' },   // NZ
  { label: '+44', value: '+44' },   // UK
  { label: '+1',  value: '+1'  },   // US/CA
  { label: '+65', value: '+65' },   // SG
  { label: '+91', value: '+91' },   // IN
  { label: '+971', value: '+971' }, // UAE
  { label: '+27', value: '+27' },   // ZA
];

// Dial code to preselect per country. "Other" is absent on purpose: it leaves the code as-is.
// Every value must exist in DIAL_CODES. Canada shares +1 with the US.
const COUNTRY_DIAL_CODE = DIAL_CODE_BY_NAME;

interface ContactFormData {
  email: string;
  dialCode: string;
  phone: string;
  companyName: string;
  country: string;
}

const INITIAL_FORM: ContactFormData = {
  email: '',
  dialCode: '+61',
  phone: '',
  companyName: '',
  country: '',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const EmailIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PhoneIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);
const BuildingIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m4-14h2m-2 4h2m-2 4h2m4-8h2m-2 4h2m-2 4h2" />
  </svg>
);

// ─── Validation ───────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: ContactFormData): AuthError[] {
  const errs: AuthError[] = [];

  const email = form.email.trim();
  if (!email) {
    errs.push({ field: 'email', message: 'Email is required.' });
  } else if (email.length > 254 || !EMAIL_RE.test(email)) {
    errs.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  const company = form.companyName.trim();
  if (!company) {
    errs.push({ field: 'companyName', message: 'Company name is required.' });
  } else if (company.length < 2) {
    errs.push({ field: 'companyName', message: 'Company name must be at least 2 characters.' });
  } else if (company.length > 100) {
    errs.push({ field: 'companyName', message: 'Company name must be 100 characters or fewer.' });
  }

  if (!form.country) {
    errs.push({ field: 'country', message: 'Please select a country.' });
  }

  // Phone is optional — only validate when something was entered.
  const phoneDigits = form.phone.replace(/[\s()-]/g, '');
  if (phoneDigits) {
    if (!/^\d{6,15}$/.test(phoneDigits)) {
      errs.push({ field: 'phone', message: 'Please enter a valid phone number (6–15 digits).' });
    }
  }

  return errs;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ContactPage: React.FC = () => {
  const [form, setForm] = useState<ContactFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<AuthError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;
  const set = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCountryChange = (country: string) =>
    setForm((prev) => ({
      ...prev,
      country,
      dialCode: COUNTRY_DIAL_CODE[country] ?? prev.dialCode,
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // guard against double submit
    setGlobalError('');

    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);

    const phoneDigits = form.phone.replace(/[\s()-]/g, '');

    try {
      await contactService.submit({
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        country: form.country,
        phone: phoneDigits ? `${form.dialCode}${phoneDigits}` : undefined,
      });
      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      if (err instanceof ApiError) {
        setGlobalError(err.errors?.length ? err.errors.join(' ') : err.message);
      } else {
        setGlobalError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg animate-screen-enter">
      <Navbar />

      <main>
        <section className="relative pt-16 pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              {/* Left — intro */}
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 bg-blue-light border border-blue-200 rounded-full px-3 py-1.5 mb-6">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs font-medium text-blue-700">Contact us</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight tracking-tight">
                  Let&apos;s talk about your{' '}
                  <span className="text-blue-600">migration</span>
                </h1>
                <p className="mt-6 text-lg text-text-secondary leading-relaxed">
                  Tell us a little about your company and we&apos;ll get back to you within one
                  business day. Prefer email? Reach us directly at{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                    {CONTACT_EMAIL}
                  </a>.
                </p>
              </div>

              {/* Right — form card */}
              <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">Thanks — we&apos;ve got it</h2>
                    <p className="mt-2 text-sm text-text-secondary">
                      Your message is on its way to our team. We&apos;ll be in touch shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1">Send us a message</h2>
                    <p className="text-sm text-text-secondary mb-6">Fields marked * are required.</p>

                    {globalError && (
                      <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-700">{globalError}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      {/* Email */}
                      <InputField
                        label="Work email"
                        id="email"
                        type="email"
                        inputMode="email"
                        value={form.email}
                        onChange={(e) => set('email', e.target.value)}
                        placeholder="jane@company.com"
                        autoComplete="email"
                        maxLength={254}
                        required
                        error={fieldError('email')}
                        iconLeft={EmailIcon}
                      />

                      {/* Company name */}
                      <InputField
                        label="Company name"
                        id="companyName"
                        value={form.companyName}
                        onChange={(e) => set('companyName', e.target.value)}
                        placeholder="Acme Pty Ltd"
                        autoComplete="organization"
                        maxLength={100}
                        required
                        error={fieldError('companyName')}
                        iconLeft={BuildingIcon}
                      />

                      {/* Country */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="country" className="text-xs font-medium text-text-secondary">
                          Country / Region <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <select
                          id="country"
                          value={form.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${
                            fieldError('country') ? 'border-red-400 bg-red-50' : 'border-border hover:border-border-medium'
                          }`}
                        >
                          <option value="" disabled>Select a country…</option>
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {fieldError('country') && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldError('country')}
                          </p>
                        )}
                      </div>

                      {/* Phone (optional) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-text-secondary">
                          Phone <span className="text-text-tertiary">(optional)</span>
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={form.dialCode}
                            onChange={(e) => set('dialCode', e.target.value)}
                            aria-label="Dial code"
                            className="px-2 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors w-20 flex-shrink-0"
                          >
                            {DIAL_CODES.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                          <div className="flex-1">
                            <InputField
                              label=""
                              id="phone"
                              type="tel"
                              inputMode="tel"
                              value={form.phone}
                              onChange={(e) => set('phone', e.target.value)}
                              placeholder="412 345 678"
                              autoComplete="tel-national"
                              maxLength={20}
                              error={fieldError('phone')}
                              iconLeft={PhoneIcon}
                            />
                          </div>
                        </div>
                        {fieldError('phone') && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {fieldError('phone')}
                          </p>
                        )}
                      </div>

                      <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                        Send message
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
