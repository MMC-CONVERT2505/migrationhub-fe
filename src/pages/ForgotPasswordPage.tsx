import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { InputField } from '@/components/auth/InputField';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/auth';
import { resetErrorMessage } from '@/utils/password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

const EmailIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

/** Step 1 of the reset: ask for the account email; the link itself arrives by email. */
const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    if (submitting) return; // double-submit guard
    const value = email.trim();
    if (!value) { setFieldError('Email is required.'); return; }
    if (value.length > 254 || !EMAIL_RE.test(value)) { setFieldError('Please enter a valid email address.'); return; }
    setFieldError('');
    setGlobalError('');
    setSubmitting(true);
    try {
      await authService.requestPasswordReset(value);
      setSentTo(value);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setGlobalError(resetErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); void send(); };

  return (
    <AuthLayout>
      {sentTo ? (
        <div className="text-center" role="status">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Check your email</h1>
          <p className="mt-2 text-sm text-text-secondary">
            If an account exists for <strong className="text-text-primary break-all">{sentTo}</strong>, we&apos;ve sent a link to reset your password.
            It expires in 30 minutes. Not there? Check your spam folder.
          </p>
          {globalError && <p role="alert" className="mt-4 text-sm text-red-700">{globalError}</p>}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            className="mt-6"
            loading={submitting}
            disabled={cooldown > 0}
            onClick={() => void send()}
          >
            {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
          </Button>
          <button type="button" onClick={() => { setSentTo(null); setCooldown(0); }} className="mt-4 text-xs text-text-tertiary hover:text-text-secondary">
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Forgot your password?</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Enter the email you signed up with and we&apos;ll send you a link to reset it.
            </p>
          </div>

          {globalError && (
            <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <InputField
              label="Work email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              maxLength={254}
              required
              error={fieldError}
              iconLeft={EmailIcon}
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
              Send reset link
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link to="/sign-in" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">← Back to sign in</Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
