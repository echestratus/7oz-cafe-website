import { apiRequest } from '@/lib/api-client';

export type CustomerLoyaltyAccount = {
  id: string;
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  updatedAt: string;
};

export type CustomerLoyaltyTransaction = {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  source: string;
  description: string;
  createdAt: string;
};

export type CustomerLoyaltyReward = {
  id: string;
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type LoyaltyRedemption = {
  id: string;
  rewardId: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  account: CustomerLoyaltyAccount;
  reward: CustomerLoyaltyReward;
};

export async function getCustomerLoyaltyAccount(): Promise<CustomerLoyaltyAccount> {
  return apiRequest<CustomerLoyaltyAccount>('/customer/loyalty');
}

export async function getCustomerLoyaltyHistory(): Promise<CustomerLoyaltyTransaction[]> {
  return apiRequest<CustomerLoyaltyTransaction[]>('/customer/loyalty/history');
}

export async function getCustomerLoyaltyRewards(): Promise<CustomerLoyaltyReward[]> {
  return apiRequest<CustomerLoyaltyReward[]>('/customer/loyalty/rewards');
}

export async function redeemLoyaltyReward(rewardId: string): Promise<LoyaltyRedemption> {
  return apiRequest<LoyaltyRedemption>('/customer/loyalty/redeem', {
    method: 'POST',
    body: { rewardId },
  });
}
