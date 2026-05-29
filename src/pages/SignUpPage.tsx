import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { InputField } from '@/components/auth/InputField';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialButton } from '@/components/auth/SocialButton';
import { Divider } from '@/components/auth/Divider';
import { Button } from '@/components/common/Button';
import type { SignUpFormData, AuthError } from '@/types/auth';

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = [
  'Australia', 'New Zealand', 'United Kingdom', 'United States',
  'Canada', 'Singapore', 'India', 'UAE', 'South Africa', 'Other',
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const UserIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const EmailIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const BuildingIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

// ─── Validators ───────────────────────────────────────────────────────────────
function validate(form: SignUpFormData): AuthError[] {
  const errs: AuthError[] = [];
  if (!form.firstName.trim()) errs.push({ field: 'firstName', message: 'First name is required.' });
  if (!form.lastName.trim())  errs.push({ field: 'lastName',  message: 'Last name is required.' });
  if (!form.email.trim())     errs.push({ field: 'email',     message: 'Email is required.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.push({ field: 'email', message: 'Please enter a valid email address.' });
  if (!form.company.trim())   errs.push({ field: 'company',   message: 'Company name is required.' });
  if (form.password.length < 8)
    errs.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  if (form.password !== form.confirmPassword)
    errs.push({ field: 'confirmPassword', message: 'Passwords do not match.' });
  if (!form.agreedToTerms)
    errs.push({ field: 'agreedToTerms', message: 'You must accept the Terms of Service to continue.' });
  return errs;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    country: 'Australia',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [errors, setErrors]     = useState<AuthError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'microsoft' | null>(null);

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;
  const set = <K extends keyof SignUpFormData>(key: K, value: SignUpFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);
    // Simulate API call (replace with real auth)
    await new Promise((r) => setTimeout(r, 1800));
    setSubmitting(false);
    navigate('/');
  };

  const handleSocial = async (provider: 'google' | 'microsoft') => {
    setSocialLoading(provider);
    await new Promise((r) => setTimeout(r, 1200));
    setSocialLoading(null);
    navigate('/');
  };

  return (
    <AuthLayout
      heading="Start migrating your accounting data today"
      subheading="Create your free account and join 500+ firms who trust MMC Convert for accurate, verified data migrations."
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-text-secondary">Free to get started · No credit card required</p>
      </div>

      {/* Social sign-up */}
      <div className="space-y-2.5 mb-1">
        <SocialButton
          provider="google"
          loading={socialLoading === 'google'}
          onClick={() => handleSocial('google')}
        />
        <SocialButton
          provider="microsoft"
          loading={socialLoading === 'microsoft'}
          onClick={() => handleSocial('microsoft')}
        />
      </div>

      <Divider label="or sign up with email" />

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="First name"
            id="firstName"
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
            required
            error={fieldError('firstName')}
            iconLeft={UserIcon}
          />
          <InputField
            label="Last name"
            id="lastName"
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            placeholder="Smith"
            autoComplete="family-name"
            required
            error={fieldError('lastName')}
          />
        </div>

        {/* Work email */}
        <InputField
          label="Work email"
          type="email"
          id="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="jane@company.com"
          autoComplete="email"
          required
          error={fieldError('email')}
          iconLeft={EmailIcon}
        />

        {/* Company */}
        <InputField
          label="Company name"
          id="company"
          value={form.company}
          onChange={(e) => set('company', e.target.value)}
          placeholder="Acme Accounting Pty Ltd"
          autoComplete="organization"
          required
          error={fieldError('company')}
          iconLeft={BuildingIcon}
        />

        {/* Country */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="country" className="text-xs font-medium text-text-secondary">Country / Region</label>
          <select
            id="country"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          >
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Password with strength meter */}
        <PasswordField
          id="new-password"
          label="Password"
          value={form.password}
          onChange={(v) => set('password', v)}
          placeholder="Min. 8 characters"
          required
          showStrength
          error={fieldError('password')}
        />

        {/* Confirm password */}
        <PasswordField
          id="confirm-password"
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(v) => set('confirmPassword', v)}
          placeholder="Re-enter your password"
          required
          error={fieldError('confirmPassword')}
        />

        {/* Terms */}
        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.agreedToTerms}
                onChange={(e) => set('agreedToTerms', e.target.checked)}
              />
              <div
                className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                  form.agreedToTerms
                    ? 'bg-blue-600 border-blue-600'
                    : fieldError('agreedToTerms')
                    ? 'border-red-400'
                    : 'border-border group-hover:border-border-medium'
                }`}
              >
                {form.agreedToTerms && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-text-secondary leading-relaxed">
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
            </span>
          </label>
          {fieldError('agreedToTerms') && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 ml-6">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldError('agreedToTerms')}
            </p>
          )}
        </div>

        {/* What you get */}
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-green-800 mb-2">What you get for free:</p>
          <ul className="space-y-1">
            {[
              'Access to 5 free migration pairs',
              '100% accurate trial balance verification',
              '24/7 email support',
              'No credit card required',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Submit */}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
          Create free account
        </Button>

        <p className="text-center text-xs text-text-tertiary">
          🔒 Your data is encrypted and never sold to third parties
        </p>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/sign-in" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Sign in →
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignUpPage;
