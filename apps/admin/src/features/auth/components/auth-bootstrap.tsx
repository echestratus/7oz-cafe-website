'use client';

import { useEffect, type ReactNode } from 'react';

import { refreshSession } from '@/services/auth';
import { useAuthStore } from '@/stores/auth-store';

interface AuthBootstrapProps {
  children: ReactNode;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const session = await refreshSession();
        if (!active) {
          return;
        }
        setSession(session.accessToken, session.user);
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [clearSession, setHydrated, setSession]);

  return children;
}
