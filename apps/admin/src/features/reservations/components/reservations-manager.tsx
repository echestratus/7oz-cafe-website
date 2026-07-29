'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  cancelReservation,
  checkInReservation,
  completeReservation,
  confirmReservation,
  listReservations,
  markNoShow,
  type Reservation,
} from '@/services/reservations';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked in' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
] as const;

function todayISODate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

function nextActions(status: string): Array<'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show'> {
  switch (status) {
    case 'pending':
      return ['confirm', 'cancel'];
    case 'confirmed':
      return ['check_in', 'cancel', 'no_show'];
    case 'checked_in':
      return ['complete', 'cancel'];
    default:
      return [];
  }
}

export function ReservationsManager() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISODate());
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-reservations', date, status],
    queryFn: () => listReservations({ date: date || undefined, status: status || undefined, limit: 50 }),
  });

  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show';
    }) => {
      switch (action) {
        case 'confirm':
          return confirmReservation(id);
        case 'check_in':
          return checkInReservation(id);
        case 'complete':
          return completeReservation(id);
        case 'cancel':
          return cancelReservation(id, 'Cancelled by admin');
        case 'no_show':
          return markNoShow(id);
      }
    },
    onSuccess: async () => {
      setError(null);
      setMessage('Reservation updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-reservations'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Action failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Review booking requests and move guests through the service flow."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="rounded-[12px] border border-border bg-surface px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-[12px] border border-border bg-surface px-3 py-2"
          >
            {statuses.map((item) => (
              <option key={item.value || 'all'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message ? (
        <p className="mb-4 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {listQuery.isLoading ? <p className="text-sm text-text-secondary">Loading reservations…</p> : null}
      {listQuery.isError ? (
        <p className="text-sm text-red-700" role="alert">
          {listQuery.error instanceof ApiClientError
            ? listQuery.error.message
            : 'Unable to load reservations.'}
        </p>
      ) : null}

      {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
        <p className="text-sm text-text-secondary">No reservations match these filters.</p>
      ) : null}

      <div className="space-y-3">
        {(listQuery.data?.items ?? []).map((item) => (
          <ReservationRow
            key={item.id}
            reservation={item}
            pending={actionMutation.isPending}
            onAction={(action) => actionMutation.mutate({ id: item.id, action })}
          />
        ))}
      </div>
    </div>
  );
}

function ReservationRow({
  reservation,
  pending,
  onAction,
}: {
  reservation: Reservation;
  pending: boolean;
  onAction: (action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show') => void;
}) {
  const actions = nextActions(reservation.status);

  return (
    <article className="rounded-[16px] border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-text">
            {reservation.guestFullName}{' '}
            <span className="text-sm font-normal text-text-secondary">
              · {reservation.reservationNumber}
            </span>
          </p>
          <p className="text-sm text-text-secondary">
            {reservation.date} at {reservation.time} · {reservation.guestCount} guests ·{' '}
            <span className="capitalize">{reservation.status.replace('_', ' ')}</span>
          </p>
          <p className="text-sm text-text-muted">
            {reservation.guestEmail} · {reservation.guestPhone}
          </p>
          {reservation.notes ? (
            <p className="pt-1 text-sm text-text-secondary">{reservation.notes}</p>
          ) : null}
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={pending}
                onClick={() => onAction(action)}
                className="rounded-[12px] border border-border px-3 py-2 text-sm text-text hover:bg-surface-secondary disabled:opacity-60"
              >
                {actionLabel(action)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function actionLabel(action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show'): string {
  switch (action) {
    case 'confirm':
      return 'Confirm';
    case 'check_in':
      return 'Check in';
    case 'complete':
      return 'Complete';
    case 'cancel':
      return 'Cancel';
    case 'no_show':
      return 'No show';
  }
}
