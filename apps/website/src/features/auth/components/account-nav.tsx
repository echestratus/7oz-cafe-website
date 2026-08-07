'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { ApiClientError } from '@/lib/api-client';
import { logout } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

interface AccountNavProps {
  tone?: 'overlay' | 'solid';
  layout?: 'inline' | 'stack';
  onNavigate?: () => void;
}

export function AccountNav({
  tone = 'solid',
  layout = 'inline',
  onNavigate,
}: AccountNavProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isOverlay = tone === 'overlay';
  const isStack = layout === 'stack';
  const linkClass = isOverlay
    ? 'text-white/78 hover:text-white'
    : 'text-text-secondary hover:text-text';
  const stackLinkClass =
    'block rounded-[12px] px-3 py-3 text-lg font-medium text-text transition-colors duration-200 hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  if (!hydrated) {
    return (
      <span className={isStack ? 'px-3 py-3 text-lg text-text-muted' : `text-nav ${linkClass}`}>
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={
          isStack
            ? stackLinkClass
            : `text-nav transition-colors duration-200 ${linkClass}`
        }
        onClick={onNavigate}
      >
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
      onNavigate?.();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div className={isStack ? 'flex flex-col gap-1' : 'flex items-center gap-4'}>
      <Link
        href="/account"
        className={
          isStack
            ? stackLinkClass
            : `text-nav transition-colors duration-200 ${linkClass}`
        }
        onClick={onNavigate}
      >
        Account
      </Link>
      <button
        type="button"
        onClick={onLogout}
        disabled={isPending}
        className={
          isStack
            ? `${stackLinkClass} w-full text-left disabled:opacity-50`
            : `text-nav transition-colors duration-200 disabled:opacity-50 ${linkClass}`
        }
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
