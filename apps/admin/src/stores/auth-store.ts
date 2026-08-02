import { create } from 'zustand';

import type { AuthUser } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (hydrated) => set({ hydrated }),
  hasPermission: (permission) => {
    const permissions = get().user?.permissions ?? [];
    return permissions.includes(permission);
  },
}));
