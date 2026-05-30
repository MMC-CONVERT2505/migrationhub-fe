import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { InputField } from '@/components/auth/InputField';
import { PasswordField } from '@/components/auth/PasswordField';
import { SocialButton } from '@/components/auth/SocialButton';
import { Divider } from '@/components/auth/Divider';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/auth';
import { usersService } from '@/api/users';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { SignInFormData, AuthError } from '@/types/auth';

// ─── Email icon ───────────────────────────────────────────────────────────────
const EmailIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ─── Validators ───────────────────────────────────────────────────────────────
function validate(form: SignInFormData): AuthError[] {
  const errors: AuthError[] = [];
  if (!form.email.trim()) errors.push({ field: 'email', message: 'Email is required.' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  if (!form.password) errors.push({ field: 'password', message: 'Password is required.' });
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  const [form, setForm] = useState<SignInFormData>({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<AuthError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [globalError, setGlobalError] = useState('');

  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;

  const set = <K extends keyof SignInFormData>(key: K, value: SignInFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitting(true);

    try {
      const response = await authService.login({
        identifier: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      });

      const { accessToken } = response;
      setToken(accessToken);

      try {
        const me = await usersService.getMe();
        setUser(me.data);
      } catch {
        // profile fetch is non-fatal — token is already stored
      }

      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 404 || err.statusCode === 401) {
          setGlobalError('Invalid email or password. Please try again.');
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

  const handleGoogleSignIn = () => {
    setSocialLoading('google');
    window.location.href = authService.googleOAuthUrl;
  };

  return (
    <AuthLayout
      heading="Migrate your accounting data with confidence"
      subheading="Sign in to access your dashboard, track ongoing migrations, and manage your account."
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Sign in to your MMC Convert account
        </p>
      </div>

      {/* Social sign-in */}
      <div className="space-y-2.5 mb-1">
        <SocialButton
          provider="google"
          loading={socialLoading === 'google'}
          onClick={handleGoogleSignIn}
        />
      </div>

      <Divider label="or sign in with email" />

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

        <InputField
          label="Work email"
          type="email"
          id="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
          error={fieldError('email')}
          iconLeft={EmailIcon}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-secondary">
              Password <span className="text-red-500">*</span>
            </span>
            <Link
              to="/forgot-password"
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordField
            id="password"
            label=""
            value={form.password}
            onChange={(v) => set('password', v)}
            placeholder="••••••••"
            required
            error={fieldError('password')}
          />
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              className="sr-only"
              checked={form.rememberMe}
              onChange={(e) => set('rememberMe', e.target.checked)}
            />
            <div
              className={`w-4 h-4 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                form.rememberMe
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-border group-hover:border-border-medium'
              }`}
            >
              {form.rememberMe && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-text-secondary">Remember me for 30 days</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
        >
          Sign in
        </Button>

        <p className="text-center text-xs text-text-tertiary">
          🔒 Protected by 256-bit SSL encryption
        </p>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/sign-up" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
          Create account →
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignInPage;
