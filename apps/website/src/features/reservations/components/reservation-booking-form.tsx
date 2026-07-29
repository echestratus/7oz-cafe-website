'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  createReservation,
  getAvailability,
  ReservationApiError,
  type AvailabilitySlot,
  type Reservation,
} from '@/services/reservations';

function todayISODate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function ReservationBookingForm() {
  const [date, setDate] = useState(todayISODate);
  const [guestCount, setGuestCount] = useState(2);
  const [time, setTime] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Reservation | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      setSlotsLoading(true);
      setSlotsError(null);
      setTime('');
      try {
        const next = await getAvailability(date, guestCount);
        if (!cancelled) {
          setSlots(next);
        }
      } catch (error) {
        if (!cancelled) {
          setSlots([]);
          setSlotsError(
            error instanceof ReservationApiError
              ? error.message
              : 'Unable to load availability right now.',
          );
        }
      } finally {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [date, guestCount]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    startTransition(async () => {
      try {
        const reservation = await createReservation({
          fullName,
          email,
          phone,
          date,
          time,
          guestCount,
          notes: notes.trim() || undefined,
        });
        setConfirmation(reservation);
      } catch (error) {
        setSubmitError(
          error instanceof ReservationApiError
            ? error.message
            : 'Unable to create reservation. Please try again.',
        );
      }
    });
  }

  if (confirmation) {
    return (
      <div className="space-y-6 rounded-[24px] bg-surface-secondary p-8 md:p-10">
        <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Confirmed request</p>
        <h2 className="font-heading text-4xl text-text">We saved your table request</h2>
        <p className="text-text-secondary">
          Reservation <span className="text-text">{confirmation.reservationNumber}</span> for{' '}
          {confirmation.guestCount} guests on {confirmation.date} at {confirmation.time}.
        </p>
        <p className="text-sm text-text-muted">
          Status is currently <span className="capitalize text-text">{confirmation.status}</span>.
          Our team will confirm shortly.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setConfirmation(null);
            setNotes('');
            setTime('');
          }}
        >
          Make another reservation
        </Button>
      </div>
    );
  }

  const availableSlots = slots.filter((slot) => slot.available);

  return (
    <form onSubmit={onSubmit} className="space-y-8 rounded-[24px] bg-surface-secondary p-8 md:p-10">
      <div className="space-y-2">
        <h2 className="font-heading text-3xl text-text md:text-4xl">Reserve a table</h2>
        <p className="text-sm text-text-secondary">
          Choose a date and party size, then pick an open time.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm">
          <span className="text-text">Date</span>
          <input
            type="date"
            required
            min={todayISODate()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-text">Guests</span>
          <input
            type="number"
            required
            min={1}
            max={12}
            value={guestCount}
            onChange={(event) => setGuestCount(Number(event.target.value) || 1)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-text">Available times</legend>
        {slotsLoading ? <p className="text-sm text-text-secondary">Checking availability…</p> : null}
        {slotsError ? (
          <p className="text-sm text-red-700" role="alert">
            {slotsError}
          </p>
        ) : null}
        {!slotsLoading && !slotsError && availableSlots.length === 0 ? (
          <p className="text-sm text-text-secondary">No open slots for this date and party size.</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {availableSlots.map((slot) => {
            const selected = time === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => setTime(slot.time)}
                aria-pressed={selected}
                className={`min-h-11 rounded-[12px] border px-4 py-2 text-sm transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-border bg-surface text-text hover:bg-background'
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-2 text-sm sm:col-span-2">
          <span className="text-text">Full name</span>
          <input
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-text">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-text">Phone</span>
          <input
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
        <label className="block space-y-2 text-sm sm:col-span-2">
          <span className="text-text">Notes (optional)</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full rounded-[12px] border border-border bg-surface px-4 py-3 text-text outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>
      </div>

      {submitError ? (
        <p className="text-sm text-red-700" role="alert">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={!time || isPending}>
        {isPending ? 'Submitting…' : 'Request reservation'}
      </Button>
    </form>
  );
}
