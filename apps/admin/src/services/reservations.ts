import { apiRequest } from '@/lib/api-client';

export type Reservation = {
  id: string;
  reservationNumber: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  date: string;
  time: string;
  guestCount: number;
  status: string;
  notes: string;
  tableId?: string | null;
  createdAt: string;
};

export type ReservationListResponse = {
  items: Reservation[];
  page: number;
  limit: number;
  total: number;
};

export async function listReservations(params: {
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ReservationListResponse> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.status) search.set('status', params.status);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));

  return apiRequest<ReservationListResponse>(`/admin/reservations?${search.toString()}`);
}

export async function confirmReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/admin/reservations/${id}/confirm`, { method: 'PATCH' });
}

export async function checkInReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/admin/reservations/${id}/check-in`, { method: 'PATCH' });
}

export async function completeReservation(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/admin/reservations/${id}/complete`, { method: 'PATCH' });
}

export async function cancelReservation(id: string, reason = ''): Promise<Reservation> {
  return apiRequest<Reservation>(`/admin/reservations/${id}/cancel`, {
    method: 'PATCH',
    body: { reason },
  });
}

export async function markNoShow(id: string): Promise<Reservation> {
  return apiRequest<Reservation>(`/admin/reservations/${id}/no-show`, { method: 'PATCH' });
}
