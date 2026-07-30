'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import {
  cancelCustomerReservation,
  listCustomerReservations,
  type Reservation,
} from '@/services/customer-reservations';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(date);
}

function canCancel(status: string): boolean {
  return status === 'pending' || status === 'confirmed';
}

export function AccountReservationsSection() {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const reservationsQuery = useQuery({
    queryKey: ['customer-reservations'],
    queryFn: listCustomerReservations,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelCustomerReservation(id),
    onSuccess: async () => {
      setActionError(null);
      setActionMessage('Reservation cancelled.');
      await queryClient.invalidateQueries({ queryKey: ['customer-reservations'] });
    },
    onError: (error) => {
      setActionMessage(null);
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to cancel this reservation.',
      );
    },
  });

  const items = reservationsQuery.data ?? [];

  return (
    <section id="reservations" className="space-y-6 scroll-mt-28" aria-labelledby="reservations-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="reservations-heading" className="text-section-title text-text">
          My reservations
        </h2>
        <Button href="/reservations" variant="outline">
          Book a table
        </Button>
      </div>

      {actionMessage ? (
        <p className="text-sm text-text-secondary" role="status">
          {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-red-700" role="alert">
          {actionError}
        </p>
      ) : null}

      {reservationsQuery.isLoading ? (
        <p className="text-sm text-text-secondary">Loading reservations…</p>
      ) : null}

      {reservationsQuery.error ? (
        <p className="text-sm text-red-700" role="alert">
          {reservationsQuery.error instanceof ApiClientError
            ? reservationsQuery.error.message
            : 'Unable to load reservations.'}
        </p>
      ) : null}

      {!reservationsQuery.isLoading && !reservationsQuery.error && items.length === 0 ? (
        <p className="text-sm text-text-secondary">
          No reservations yet. Book a table while signed in to link visits to loyalty and membership.
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((item) => (
            <ReservationRow
              key={item.id}
              item={item}
              pending={cancelMutation.isPending}
              onCancel={() => {
                setActionError(null);
                setActionMessage(null);
                cancelMutation.mutate(item.id);
              }}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ReservationRow({
  item,
  pending,
  onCancel,
}: {
  item: Reservation;
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <li className="space-y-3 border-t border-border pt-4 sm:flex sm:items-start sm:justify-between sm:gap-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">
          {item.reservationNumber} · {formatDate(item.date)} at {item.time}
        </p>
        <p className="text-sm text-text-secondary">
          {item.guestCount} guests · <span className="capitalize">{item.status}</span>
        </p>
        {item.notes ? <p className="text-sm text-text-muted">{item.notes}</p> : null}
      </div>
      {canCancel(item.status) ? (
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </li>
  );
}
