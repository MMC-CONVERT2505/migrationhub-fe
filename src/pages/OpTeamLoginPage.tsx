import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { opTeamService } from '@/api/opTeam';
import { ApiError } from '@/api/client';
import { useOpTeamStore } from '@/store/opTeamStore';

const OpTeamLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useOpTeamStore((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { accessToken, member } = await opTeamService.login(email.trim(), password);
      signIn(accessToken, member);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        setError('Invalid email or password.');
      } else if (err instanceof ApiError && err.statusCode === 429) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-text-primary">Operation Team</h1>
          <p className="text-sm text-text-secondary mt-1">MMC Convert</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-base font-semibold text-text-primary mb-5">Sign in to continue</h2>

          {error && (
            <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="op-email" className="block text-xs font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <input
                id="op-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2.5 text-sm text-text-primary bg-white border border-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="op-password" className="block text-xs font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                id="op-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-3 py-2.5 text-sm text-text-primary bg-white border border-border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-text-tertiary hover:text-text-secondary transition-colors">
            ← Continue as guest
          </Link>
        </p>
      </div>
    </div>
  );
};

export default OpTeamLoginPage;
