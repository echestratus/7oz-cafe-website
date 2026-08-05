import { apiRequest } from '@/lib/api-client';

export type StaffUser = {
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
};

export type StaffRole = {
  code: string;
  name: string;
  description: string;
};

export type StaffUserListResponse = {
  items: StaffUser[];
  page: number;
  limit: number;
  total: number;
};

export type CreateStaffUserInput = {
  email: string;
  fullName: string;
  password: string;
  roleCode: 'admin' | 'super_admin';
};

export async function listStaffUsers(params: {
  status?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<StaffUserListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.role) search.set('role', params.role);
  if (params.search) search.set('search', params.search);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return apiRequest<StaffUserListResponse>(`/admin/users?${search.toString()}`);
}

export async function getStaffUser(id: string): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/admin/users/${id}`);
}

export async function createStaffUser(input: CreateStaffUserInput): Promise<StaffUser> {
  return apiRequest<StaffUser>('/admin/users', {
    method: 'POST',
    body: input,
  });
}

export async function updateStaffUserStatus(
  id: string,
  status: string,
  reason = '',
): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: { status, reason },
  });
}

export async function updateStaffUserRole(id: string, roleCode: string): Promise<StaffUser> {
  return apiRequest<StaffUser>(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: { roleCode },
  });
}

export async function listStaffRoles(): Promise<StaffRole[]> {
  return apiRequest<StaffRole[]>('/admin/roles');
}
