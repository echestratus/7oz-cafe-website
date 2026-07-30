import { apiRequest } from '@/lib/api-client';
import type { Reservation } from '@/services/reservations';

export type { Reservation };

export async function listCustomerReservations(): Promise<Reservation[]> {
  return apiRequest<Reservation[]>('/customer/reservations');
}

export async function cancelCustomerReservation(
  id: string,
  reason = 'Cancelled by customer',
): Promise<Reservation> {
  return apiRequest<Reservation>(`/customer/reservations/${id}`, {
    method: 'DELETE',
    body: { reason },
  });
}
