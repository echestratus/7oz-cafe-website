import { apiRequest } from '@/lib/api-client';
import type { AuthSession, AuthUser } from '@/types/auth';

export async function login(email: string, password: string): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}

export async function logout(): Promise<void> {
  await apiRequest<Record<string, never>>('/auth/logout', {
    method: 'POST',
    auth: false,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export async function refreshSession(): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/refresh', {
    method: 'POST',
    auth: false,
  });
}
