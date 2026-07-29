const DEFAULT_API_URL = 'http://localhost:8080/api/v1';
const DEFAULT_APP_URL = 'http://localhost:3000';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || DEFAULT_APP_URL;
}
