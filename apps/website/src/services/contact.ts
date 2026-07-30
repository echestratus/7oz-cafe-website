import { apiRequest } from '@/lib/api-client';

export type ContactMessageResult = {
  id: string;
};

export type CreateContactMessageInput = {
  fullName: string;
  email: string;
  phone?: string;
  message: string;
};

export async function submitContactMessage(
  input: CreateContactMessageInput,
): Promise<ContactMessageResult> {
  return apiRequest<ContactMessageResult>('/public/contact', {
    method: 'POST',
    auth: false,
    body: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? '',
      message: input.message,
    },
  });
}
