import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { ApiClientError, apiRequest } from '@/lib/api-client';
import { getApiBaseUrl } from '@/lib/env';
import { useAuthStore } from '@/stores/auth-store';

export type AvailabilitySlot = {
  time: string;
  available: boolean;
  remainingCapacity: number;
};

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

export type CreateReservationInput = {
  fullName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guestCount: number;
  notes?: string;
};

export class ReservationApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ReservationApiError';
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && 'message' in payload ? payload.message : 'Request failed. Please try again.';
    throw new ReservationApiError(message, response.status);
  }

  return payload.data;
}

export async function getAvailability(date: string, guestCount: number): Promise<AvailabilitySlot[]> {
  const params = new URLSearchParams({
    date,
    guestCount: String(guestCount),
  });

  const response = await fetch(`${getApiBaseUrl()}/public/reservations/availability?${params}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  return parseResponse<AvailabilitySlot[]>(response);
}

/** Creates via public endpoint; attaches Bearer when the customer is signed in. */
export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const hasToken = Boolean(useAuthStore.getState().accessToken);
  try {
    return await apiRequest<Reservation>('/public/reservations', {
      method: 'POST',
      auth: hasToken,
      body: input,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new ReservationApiError(error.message, error.status);
    }
    throw error;
  }
}
