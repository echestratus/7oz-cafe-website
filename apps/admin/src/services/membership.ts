import { apiRequest } from '@/lib/api-client';

export type Membership = {
  id: string;
  membershipNumber: string;
  status: string;
  qrPayload: string;
  joinedAt: string;
  userId?: string;
  userEmail?: string;
  userFullName?: string;
  level: {
    id: string;
    code: string;
    name: string;
    rank: number;
  };
  progress?: {
    completedReservations: number;
    lifetimeLoyaltyPoints: number;
  };
};

export type MembershipListResponse = {
  items: Membership[];
  page: number;
  limit: number;
  total: number;
};

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
};

export async function listMemberships(params: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<MembershipListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return apiRequest<MembershipListResponse>(`/admin/memberships?${search.toString()}`);
}

export async function updateMembershipStatus(
  id: string,
  status: string,
  reason = '',
): Promise<Membership> {
  return apiRequest<Membership>(`/admin/memberships/${id}/status`, {
    method: 'PATCH',
    body: { status, reason },
  });
}

export async function listMembershipLevels(): Promise<MembershipLevel[]> {
  return apiRequest<MembershipLevel[]>('/admin/membership-levels');
}

export async function updateMembershipLevel(
  id: string,
  payload: {
    qualificationRules: MembershipLevel['qualificationRules'];
    description?: string;
    isActive?: boolean;
  },
): Promise<MembershipLevel> {
  return apiRequest<MembershipLevel>(`/admin/membership-levels/${id}`, {
    method: 'PATCH',
    body: payload,
  });
}
