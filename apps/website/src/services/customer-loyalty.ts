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

export async function getCustomerLoyaltyAccount(): Promise<CustomerLoyaltyAccount> {
  return apiRequest<CustomerLoyaltyAccount>('/customer/loyalty');
}

export async function getCustomerLoyaltyHistory(): Promise<CustomerLoyaltyTransaction[]> {
  return apiRequest<CustomerLoyaltyTransaction[]>('/customer/loyalty/history');
}
