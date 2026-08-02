'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ApiClientError } from '@/lib/api-client';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

interface AccountNavProps {
  tone?: 'overlay' | 'solid';
}

export function AccountNav({ tone = 'solid' }: AccountNavProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isOverlay = tone === 'overlay';
  const linkClass = isOverlay
    ? 'text-white/78 hover:text-white'
    : 'text-text-secondary hover:text-text';

  if (!hydrated) {
    return <span className={`text-nav ${linkClass}`}>…</span>;
  }

  if (!user) {
    return (
      <Link href="/login" className={`text-nav transition-colors duration-200 ${linkClass}`}>
        Sign in
      </Link>
    );
  }

  function onLogout() {
    setError(null);
    startTransition(async () => {
      try {
        await logout();
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Unable to sign out.');
        return;
      }
      clearSession();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/account" className={`text-nav transition-colors duration-200 ${linkClass}`}>
        Account
      </Link>
      <button
        type="button"
        onClick={onLogout}
        disabled={isPending}
        className={`text-nav transition-colors duration-200 disabled:opacity-50 ${linkClass}`}
        aria-label="Sign out"
      >
        {isPending ? 'Signing out…' : 'Sign out'}
      </button>
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
