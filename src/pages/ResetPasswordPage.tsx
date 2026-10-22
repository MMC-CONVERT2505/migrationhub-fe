import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/common/Button';
import { authService } from '@/api/auth';
import { ApiError } from '@/api/client';
import { resetErrorMessage, validateNewPassword } from '@/utils/password';

/** Step 2 of the reset: choose a new password using the single-use token from the email. */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Read once, then drop it from the address bar so it can't leak through history or a Referer header.
  const [token] = useState(() => searchParams.get('token')?.trim() ?? '');
  useEffect(() => {
    if (searchParams.has('token')) navigate('/reset-password', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [linkDead, setLinkDead] = useState(!token);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate('/sign-in', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // double-submit guard
    setGlobalError('');
    const next: typeof errors = {};
    const pwErr = validateNewPassword(password);
    if (pwErr) next.password = pwErr;
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    try {
      await authService.confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      // 400 = the link is used/expired/invalid (or the password was rejected); only the former is terminal.
      if (err instanceof ApiError && err.statusCode === 400 && /invalid or has expired/i.test(err.message)) setLinkDead(true);
      else setGlobalError(resetErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center" role="status">
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Password updated</h1>
          <p className="mt-2 text-sm text-text-secondary">You&apos;ve been signed out everywhere. Sign in with your new password.</p>
          <Link to="/sign-in" replace className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">Go to sign in →</Link>
        </div>
      </AuthLayout>
    );
  }

  if (linkDead) {
    return (
      <AuthLayout>
        <div className="text-center" role="alert">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">This link can&apos;t be used</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Reset links work once and expire after 30 minutes. Request a new one to continue.
          </p>
          <Link to="/forgot-password" className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Request a new link
          </Link>
          <p className="mt-4"><Link to="/sign-in" className="text-sm text-text-secondary hover:text-text-primary">← Back to sign in</Link></p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Choose a new password</h1>
        <p className="mt-1.5 text-sm text-text-secondary">8–16 characters with upper and lower case, a number and a special character.</p>
      </div>

      {globalError && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
      )}

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} required showStrength error={errors.password} />
        <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} required error={errors.confirm} />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>Reset password</Button>
      </form>

      <p className="mt-6 text-center text-sm"><Link to="/sign-in" className="text-text-secondary hover:text-text-primary">← Back to sign in</Link></p>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
