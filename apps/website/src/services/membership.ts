import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';

export type MembershipLevel = {
  id: string;
  code: string;
  name: string;
  description: string;
  rank: number;
  qualificationRules: {
    minCompletedReservations: number;
    minLifetimeLoyaltyPoints: number;
  };
  isActive: boolean;
  sortOrder: number;
};

export type MembershipBenefit = {
  id: string;
  levelId?: string | null;
  code: string;
  title: string;
  description: string;
  data: Record<string, unknown>;
  sortOrder: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(
      payload && 'message' in payload ? payload.message : 'Unable to load membership details.',
    );
  }

  return payload.data;
}

export async function getPublicMembershipLevels(): Promise<MembershipLevel[]> {
  const response = await fetch(`${getApiBaseUrl()}/public/membership/levels`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<MembershipLevel[]>(response);
}

export async function getPublicMembershipBenefits(): Promise<MembershipBenefit[]> {
  const response = await fetch(`${getApiBaseUrl()}/public/membership/benefits`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<MembershipBenefit[]>(response);
}
