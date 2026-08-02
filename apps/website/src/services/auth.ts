import { apiRequest } from '@/lib/api-client';
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordResult,
  RegisterResult,
} from '@/types/auth';

export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  return apiRequest<RegisterResult>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
}

export async function verifyEmail(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/verify-email', {
    method: 'POST',
    auth: false,
    body: { token },
  });
}

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
    trustedOrigin: true,
  });
}

export async function fetchMe(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export async function refreshSession(): Promise<AuthSession> {
  return apiRequest<AuthSession>('/auth/refresh', {
    method: 'POST',
    auth: false,
    trustedOrigin: true,
  });
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  return apiRequest<ForgotPasswordResult>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest<Record<string, never>>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, newPassword },
  });
}
