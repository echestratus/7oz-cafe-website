import { apiRequest } from '@/lib/api-client';

export type CustomerMembershipSummary = {
  id: string;
  membershipNumber: string;
  status: string;
  levelCode: string;
  levelName: string;
};

export type CustomerLoyaltySummary = {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
};

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  membership?: CustomerMembershipSummary | null;
  loyalty?: CustomerLoyaltySummary | null;
};

export type CustomerListResponse = {
  items: Customer[];
  page: number;
  limit: number;
  total: number;
};

export async function listCustomers(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<CustomerListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.search) search.set('search', params.search);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return apiRequest<CustomerListResponse>(`/admin/customers?${search.toString()}`);
}

export async function getCustomer(id: string): Promise<Customer> {
  return apiRequest<Customer>(`/admin/customers/${id}`);
}

export async function updateCustomerStatus(
  id: string,
  status: string,
  reason = '',
): Promise<Customer> {
  return apiRequest<Customer>(`/admin/customers/${id}/status`, {
    method: 'PATCH',
    body: { status, reason },
  });
}
