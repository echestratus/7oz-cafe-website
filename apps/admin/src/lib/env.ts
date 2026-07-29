const DEFAULT_API_URL = 'http://localhost:8080/api/v1';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || DEFAULT_API_URL;
}
