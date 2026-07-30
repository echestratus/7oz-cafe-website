import { apiRequest } from '@/lib/api-client';

export type LoyaltyAccount = {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  userEmail?: string;
  userFullName?: string;
  updatedAt: string;
};

export type LoyaltyTransaction = {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  source: string;
  description: string;
  createdAt: string;
  userEmail?: string;
  userFullName?: string;
};

export type LoyaltyCampaign = {
  id: string;
  code: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  pointMultiplier: number;
  bonusPoints: number;
  isActive: boolean;
};

export type LoyaltyReward = {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number | null;
  isActive: boolean;
  sortOrder: number;
  data: Record<string, unknown>;
};

export type LoyaltyRewardInput = {
  code?: string;
  title: string;
  description?: string;
  pointsCost: number;
  stock?: number | null;
  isActive?: boolean;
  sortOrder?: number;
  data?: Record<string, unknown>;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};

export async function listLoyaltyAccounts(page = 1, limit = 20): Promise<Paginated<LoyaltyAccount>> {
  return apiRequest<Paginated<LoyaltyAccount>>(`/admin/loyalty?page=${page}&limit=${limit}`);
}

export async function listLoyaltyHistory(page = 1, limit = 30): Promise<Paginated<LoyaltyTransaction>> {
  return apiRequest<Paginated<LoyaltyTransaction>>(`/admin/loyalty/history?page=${page}&limit=${limit}`);
}

export async function adjustLoyalty(input: {
  userId: string;
  points: number;
  reason: string;
}): Promise<LoyaltyAccount> {
  return apiRequest<LoyaltyAccount>('/admin/loyalty/adjustments', {
    method: 'POST',
    body: input,
  });
}

export async function listLoyaltyCampaigns(): Promise<LoyaltyCampaign[]> {
  return apiRequest<LoyaltyCampaign[]>('/admin/loyalty/campaigns');
}

export async function listLoyaltyRewards(): Promise<LoyaltyReward[]> {
  return apiRequest<LoyaltyReward[]>('/admin/loyalty/rewards');
}

export async function createLoyaltyReward(input: LoyaltyRewardInput): Promise<LoyaltyReward> {
  return apiRequest<LoyaltyReward>('/admin/loyalty/rewards', {
    method: 'POST',
    body: input,
  });
}

export async function updateLoyaltyReward(
  id: string,
  input: LoyaltyRewardInput,
): Promise<LoyaltyReward> {
  return apiRequest<LoyaltyReward>(`/admin/loyalty/rewards/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteLoyaltyReward(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/admin/loyalty/rewards/${id}`, {
    method: 'DELETE',
  });
}
