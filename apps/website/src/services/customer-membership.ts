import { apiRequest } from '@/lib/api-client';
import type { MembershipBenefit, MembershipLevel } from '@/services/membership';

export type CustomerMembershipProgress = {
  completedReservations: number;
  lifetimeLoyaltyPoints: number;
  nextLevelCode?: string;
  nextLevelName?: string;
  reservationsRemaining?: number | null;
};

export type CustomerMembership = {
  id: string;
  membershipNumber: string;
  status: string;
  qrPayload: string;
  joinedAt: string;
  expiresAt?: string | null;
  level: MembershipLevel;
  progress: CustomerMembershipProgress;
};

export type CustomerMembershipHistory = {
  id: string;
  fromLevelCode?: string | null;
  fromLevelName?: string | null;
  toLevelCode: string;
  toLevelName: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  reason: string;
  triggerSource: string;
  createdAt: string;
};

export async function getCustomerMembership(): Promise<CustomerMembership> {
  return apiRequest<CustomerMembership>('/customer/membership');
}

export async function getCustomerMembershipBenefits(): Promise<MembershipBenefit[]> {
  return apiRequest<MembershipBenefit[]>('/customer/membership/benefits');
}

export async function getCustomerMembershipHistory(): Promise<CustomerMembershipHistory[]> {
  return apiRequest<CustomerMembershipHistory[]>('/customer/membership/history');
}
