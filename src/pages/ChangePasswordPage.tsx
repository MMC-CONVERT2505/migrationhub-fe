import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { CompactFooter } from '@/components/layout/Footer';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/common/Button';
import { usersService } from '@/api/users';
import { authService } from '@/api/auth';
import { ApiError } from '@/api/client';
import { useAuthStore, useSession } from '@/store/authStore';
import { validateNewPassword } from '@/utils/password';

type Errors = { current?: string; password?: string; confirm?: string };

/** Signed-in customers change their password here (the emailed-link flow is for people who can't sign in). */
const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useSession('user');
  const logout = useAuthStore((s) => s.logout);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!accessToken) return <Navigate to="/sign-in" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // double-submit guard
    setGlobalError('');
    const next: Errors = {};
    const pwErr = validateNewPassword(password);
    if (pwErr) next.password = pwErr;
    else if (current && password === current) next.password = 'New password must be different from your current one.';
    if (password !== confirm) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    try {
      await usersService.changePassword({ oldPassword: current || undefined, newPassword: password, confirmPassword: confirm });
      setDone(true);
      setCurrent(''); setPassword(''); setConfirm('');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      if (err instanceof ApiError && /current password/i.test(msg)) setErrors({ current: msg });
      else if (err instanceof ApiError && err.statusCode === 429) setGlobalError('Too many attempts. Please wait a minute and try again.');
      else setGlobalError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    logout('user');
    navigate('/sign-in', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light">
      <Navbar />
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-sm p-6 sm:p-8">
          {done ? (
            <div className="text-center" role="status">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Password updated</h1>
              <p className="mt-2 text-sm text-text-secondary">Your password has been changed. Use it the next time you sign in.</p>
              <Link to="/migrations" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">Back to My Migrations →</Link>
              <button type="button" onClick={signOut} className="mt-3 block mx-auto text-xs text-text-tertiary hover:text-text-secondary">Sign out</button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Change password</h1>
              <p className="mt-1.5 mb-6 text-sm text-text-secondary">
                Forgot your current one? <Link to="/forgot-password" className="text-blue-600 font-semibold hover:text-blue-700">Reset it by email</Link>.
              </p>

              {globalError && (
                <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{globalError}</div>
              )}

              <form onSubmit={onSubmit} noValidate className="space-y-4">
                <PasswordField
                  id="current-password"
                  label="Current password"
                  value={current}
                  onChange={setCurrent}
                  error={errors.current}
                  autoComplete="current-password"
                  hint="Signed up with Google and never set a password? Leave this blank."
                />
                <PasswordField id="new-password" label="New password" value={password} onChange={setPassword} required showStrength error={errors.password} />
                <PasswordField id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} required autoComplete="new-password" error={errors.confirm} />
                <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>Update password</Button>
              </form>
            </>
          )}
        </div>
      </main>
      <CompactFooter />
    </div>
  );
};

export default ChangePasswordPage;
