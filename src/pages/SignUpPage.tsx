import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EXTERNAL_LINKS } from '@/constants/links';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { InputField } from '@/components/auth/InputField';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialButton } from '@/components/auth/SocialButton';
import { Divider } from '@/components/auth/Divider';
import { Button } from '@/components/common/Button';
import { safeNextPath } from '@/utils/authErrors';
import { authService } from '@/api/auth';
import { usersService } from '@/api/users';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { SignUpFormData, AuthError } from '@/types/auth';

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRIES = [
  'Australia', 'New Zealand', 'United Kingdom', 'United States',
  'Canada', 'Singapore', 'India', 'UAE', 'South Africa', 'Other',
];

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
const AtIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
  </svg>
);
const PhoneIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

// ─── Validators ───────────────────────────────────────────────────────────────
function validate(form: SignUpFormData): AuthError[] {
  const errs: AuthError[] = [];
  if (!form.firstName.trim()) errs.push({ field: 'firstName', message: 'First name is required.' });
  if (!form.lastName.trim())  errs.push({ field: 'lastName',  message: 'Last name is required.' });

  if (!form.username.trim()) {
    errs.push({ field: 'username', message: 'Username is required.' });
  } else if (!/^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(form.username)) {
    errs.push({ field: 'username', message: 'Username must be 3–30 chars, start with a letter, and contain only letters, numbers, or underscores.' });
  }

  if (!form.email.trim())     errs.push({ field: 'email',    message: 'Email is required.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.push({ field: 'email', message: 'Please enter a valid email address.' });

  if (form.mobile.trim() && !/^\d{6,15}$/.test(form.mobile.replace(/\s/g, ''))) {
    errs.push({ field: 'mobile', message: 'Please enter a valid mobile number.' });
  }

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
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const { setToken, setUser } = useAuthStore();

  const [form, setForm] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    dialCode: '+61',
    country: 'Australia',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });
  const [errors, setErrors]     = useState<AuthError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [globalError, setGlobalError] = useState('');

  const [otpCode, setOtpCode]     = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError]   = useState('');

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;
  const set = <K extends keyof SignUpFormData>(key: K, value: SignUpFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSendOtp = async () => {
    setOtpError('');
    if (!form.email.trim()) {
      setErrors([{ field: 'email', message: 'Enter your email before sending OTP.' }]);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrors([{ field: 'email', message: 'Please enter a valid email address.' }]);
      return;
    }
    setSendingOtp(true);
    try {
      await authService.sendCode({
        type: 'register',
        email: form.email.trim(),
        username: form.username.trim() || undefined,
      });
      setOtpSent(true);
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const errs = validate(form);
    if (otpSent && !otpCode.trim()) errs.push({ field: 'otpCode', message: 'Please enter the OTP sent to your email.' });
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);

    try {
      const response = await authService.register({
        firstname:              form.firstName.trim(),
        lastname:               form.lastName.trim(),
        username:               form.username.trim(),
        email:                  form.email.trim(),
        mobile:                 form.mobile.trim() ? `${form.dialCode}${form.mobile.trim().replace(/\s/g, '')}` : undefined,
        dialCode:               form.mobile.trim() ? form.dialCode : undefined,
        country:                form.country,
        password:               form.password,
        verificationCode:       otpCode.trim() || undefined,
      });

      const { accessToken } = response;
      setToken('user', accessToken);
      try {
        const me = await usersService.getMe();
        setUser('user', me.data);
      } catch {
        // profile fetch is non-fatal — token is already stored
      }
      navigate(next, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          // Duplicate email / username / mobile — surface as field errors where possible
          const msg = err.message.toLowerCase();
          if (msg.includes('email')) {
            setErrors([{ field: 'email', message: 'This email is already registered.' }]);
          } else if (msg.includes('username')) {
            setErrors([{ field: 'username', message: 'This username is already taken.' }]);
          } else if (msg.includes('mobile')) {
            setErrors([{ field: 'mobile', message: 'This mobile number is already registered.' }]);
          } else {
            setGlobalError(err.message);
          }
        } else if (err.errors?.length) {
          setGlobalError(err.errors.join(' '));
        } else {
          setGlobalError(err.message);
        }
      } else {
        setGlobalError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    setSocialLoading('google');
    window.location.href = authService.googleOAuthUrl;
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
          onClick={handleGoogleSignUp}
        />
      </div>

      <Divider label="or sign up with email" />

      {/* Global error banner */}
      {globalError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{globalError}</p>
        </div>
      )}

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

        {/* Username */}
        <InputField
          label="Username"
          id="username"
          value={form.username}
          onChange={(e) => set('username', e.target.value)}
          placeholder="janesmith"
          autoComplete="username"
          required
          error={fieldError('username')}
          iconLeft={AtIcon}
        />

        {/* Work email + Send OTP */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-text-secondary">
            Work email <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <InputField
                label=""
                type="email"
                id="email"
                value={form.email}
                onChange={(e) => { set('email', e.target.value); setOtpSent(false); setOtpCode(''); }}
                placeholder="jane@company.com"
                autoComplete="email"
                error={fieldError('email')}
                iconLeft={EmailIcon}
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || !form.email.trim()}
              className="flex-shrink-0 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              {sendingOtp ? 'Sending…' : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
          {otpError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {otpError}
            </p>
          )}
          {otpSent && (
            <p className="text-xs text-green-600">OTP sent to {form.email} — check your inbox.</p>
          )}
        </div>

        {/* Email OTP code */}
        {otpSent && (
          <InputField
            label="Email OTP"
            id="otpCode"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            required
            error={fieldError('otpCode')}
          />
        )}

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            Mobile number <span className="text-text-tertiary">(optional)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={form.dialCode}
              onChange={(e) => set('dialCode', e.target.value)}
              className="px-2 py-2.5 text-sm bg-white border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors w-20 flex-shrink-0"
            >
              {DIAL_CODES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <div className="flex-1">
              <InputField
                label=""
                id="mobile"
                type="tel"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                placeholder="412 345 678"
                autoComplete="tel-national"
                error={fieldError('mobile')}
                iconLeft={PhoneIcon}
              />
            </div>
          </div>
          {fieldError('mobile') && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {fieldError('mobile')}
            </p>
          )}
        </div>

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
              <a href={EXTERNAL_LINKS.terms} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Terms of Service</a>
              {' '}and{' '}
              <a href={EXTERNAL_LINKS.privacy} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Privacy Policy</a>
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

      {/* Footer links */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link
          to={`/sign-in${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
        >
          Sign in →
        </Link>
      </p>

      {next !== '/' && (
        <p className="mt-3 text-center">
          <Link to={next} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">
            Continue without signing in
          </Link>
        </p>
      )}
    </AuthLayout>
  );
};

export default SignUpPage;
