import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';

export type LoyaltyReward = {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  stock?: number | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload && 'message' in payload ? payload.message : 'Unable to load loyalty rewards.');
  }

  return payload.data;
}

export async function getPublicLoyaltyRewards(): Promise<LoyaltyReward[]> {
  const response = await fetch(`${getApiBaseUrl()}/public/loyalty/rewards`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<LoyaltyReward[]>(response);
}
