import { apiRequest } from '@/lib/api-client';

export type ContactMessageStatus = 'new' | 'read' | 'archived';

export type ContactMessage = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: ContactMessageStatus | string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactMessageListResponse = {
  items: ContactMessage[];
  page: number;
  limit: number;
  total: number;
};

export async function listContactMessages(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ContactMessageListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.search) search.set('search', params.search);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return apiRequest<ContactMessageListResponse>(`/admin/contact-messages?${search.toString()}`);
}

export async function getContactMessage(id: string): Promise<ContactMessage> {
  return apiRequest<ContactMessage>(`/admin/contact-messages/${id}`);
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessage> {
  return apiRequest<ContactMessage>(`/admin/contact-messages/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
