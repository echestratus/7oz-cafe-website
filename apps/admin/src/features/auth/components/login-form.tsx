'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { ApiClientError } from '@/lib/api-client';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState('admin@7oz.local');
  const [password, setPassword] = useState('ChangeMeNow!123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await login(email.trim(), password);
      const canAccessAdmin =
        session.user.roles.includes('admin') ||
        session.user.roles.includes('super_admin') ||
        session.user.permissions.includes('cms.manage') ||
        session.user.permissions.includes('reservation.manage') ||
        session.user.permissions.includes('membership.manage');

      if (!canAccessAdmin) {
        setError('This account does not have admin access.');
        return;
      }

      setSession(session.accessToken, session.user);
      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to sign in.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-text">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-text">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {error ? (
        <p className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
