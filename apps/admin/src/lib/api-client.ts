import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';
import { useAuthStore } from '@/stores/auth-store';

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  skipRefresh?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          Origin: window.location.origin,
        },
      });

      if (!response.ok) {
        useAuthStore.getState().clearSession();
        return false;
      }

      const payload = (await response.json()) as ApiSuccessResponse<{
        accessToken: string;
        user: {
          id: string;
          email: string;
          fullName: string;
          status: string;
          roles: string[];
          permissions: string[];
        };
      }>;

      if (!payload.success) {
        useAuthStore.getState().clearSession();
        return false;
      }

      useAuthStore.getState().setSession(payload.data.accessToken, payload.data.user);
      return true;
    } catch {
      useAuthStore.getState().clearSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  const auth = options.auth ?? true;

  if (options.body !== undefined && !options.formData) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.formData
      ? options.formData
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  if (response.status === 401 && auth && !options.skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && 'message' in payload ? payload.message : 'Request failed. Please try again.';
    const code = payload && 'code' in payload && typeof payload.code === 'string' ? payload.code : undefined;
    throw new ApiClientError(message, response.status, code);
  }

  return payload.data;
}
