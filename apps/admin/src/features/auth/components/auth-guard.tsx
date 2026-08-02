'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuthStore } from '@/stores/auth-store';

interface AuthGuardProps {
  children: ReactNode;
  permission?: string;
}

export function AuthGuard({ children, permission }: AuthGuardProps) {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!accessToken) {
      router.replace('/login');
      return;
    }

    if (permission && !hasPermission(permission)) {
      router.replace('/dashboard');
    }
  }, [accessToken, hasPermission, hydrated, permission, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-secondary">
        Loading workspace…
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  if (permission && !hasPermission(permission)) {
    return null;
  }

  return children;
}
